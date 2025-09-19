<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Boutique;
use App\Services\BoutiqueStatsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class BoutiqueStatsController extends Controller
{
    protected $statsService;

    public function __construct(BoutiqueStatsService $statsService)
    {
        $this->statsService = $statsService;
    }

    /**
     * Règles de validation communes pour l'enregistrement des vues
     */
    private function getViewValidationRules()
    {
        return [
            // Champs correspondant à la table boutique_views
            'ip_address' => 'sometimes|string|max:45',
            'user_agent' => 'sometimes|string|max:500',
            'referrer' => 'sometimes|nullable|string|max:500',
            'country' => 'sometimes|nullable|string|max:100',
            'city' => 'sometimes|nullable|string|max:100',
            'device_type' => 'sometimes|nullable|string|max:50',
            'browser' => 'sometimes|nullable|string|max:100',
            'os' => 'sometimes|nullable|string|max:100',
            'viewed_at' => 'sometimes|date',
            
            // Champs optionnels pour le contrôle
            'force_record' => 'sometimes|boolean',
            'bypass_dedup' => 'sometimes|boolean',
        ];
    }

    /**
     * Obtenir les statistiques du dashboard pour une boutique avec gestion d'erreur renforcée
     */
   public function getDashboardStats(Request $request, $id)
{
    try {
        // Validation de l'ID
        if (!is_numeric($id) || $id <= 0) {
            Log::warning('ID de boutique invalide pour getDashboardStats', ['id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'ID de boutique invalide',
                'data' => $this->getEmptyStats()
            ], 400);
        }

        // Vérifier que la boutique existe
        $boutique = Boutique::find($id);
        if (!$boutique) {
            Log::warning('Boutique non trouvée', ['boutique_id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'Boutique non trouvée',
                'data' => $this->getEmptyStats()
            ], 404);
        }

        // Validation de la période
        $period = $request->get('period', 'month');
        $validPeriods = ['today', 'week', 'month', 'year'];
        if (!in_array($period, $validPeriods)) {
            Log::warning('Période invalide pour getDashboardStats', [
                'period' => $period,
                'valid_periods' => $validPeriods
            ]);
            $period = 'month';
        }

        Log::info('Récupération des statistiques dashboard (publique)', [
            'boutique_id' => $boutique->id,
            'boutique_name' => $boutique->nom,
            'period' => $period,
        ]);

        // Utiliser le service pour obtenir les statistiques
        $stats = $this->statsService->getViewStats($boutique, $period);

        // Vérifier que les statistiques sont valides
        if (!is_array($stats)) {
            Log::error('Statistiques invalides retournées par le service', [
                'boutique_id' => $boutique->id,
                'stats' => $stats
            ]);
            $stats = $this->getEmptyStats();
        }

        // S'assurer que toutes les clés requises sont présentes
        $stats = array_merge($this->getEmptyStats(), $stats);

        Log::info('Statistiques dashboard récupérées avec succès (publique)', [
            'boutique_id' => $boutique->id,
            'stats' => $stats
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'total_views'    => (int) $stats['total_views'],
                'previous_views' => (int) $stats['previous_views'],
                'growth_rate'    => (float) $stats['growth'],
                'unique_views'   => (int) $stats['unique_views']
            ],
            'meta' => [
                'boutique_id'   => $boutique->id,
                'boutique_name' => $boutique->nom,
                'period'        => $period,
                'generated_at'  => now()->toISOString()
            ]
        ]);

    } catch (\Exception $e) {
        Log::error('Erreur lors de la récupération des statistiques dashboard (publique)', [
            'id'    => $id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Erreur interne du serveur lors de la récupération des statistiques',
            'error'   => config('app.debug') ? $e->getMessage() : 'Une erreur est survenue',
            'data'    => $this->getEmptyStats()
        ], 500);
    }
}

    /**
     * Obtenir le nombre de vues public d'une boutique (sans authentification) - CORRIGÉ
     */
    public function getPublicViewCount($id)
    {
        try {
            // Validation de l'ID
            if (!is_numeric($id) || $id <= 0) {
                Log::warning('ID de boutique invalide pour getPublicViewCount', ['id' => $id]);
                return response()->json([
                    'success' => false,
                    'message' => 'ID de boutique invalide'
                ], 400);
            }

            // Vérifier que la boutique existe et est active
            $boutique = Boutique::where('id', $id)
                ->where('status', 'active')
                ->first();

            if (!$boutique) {
                Log::info('Boutique non trouvée ou inactive pour getPublicViewCount', ['id' => $id]);
                return response()->json([
                    'success' => false,
                    'message' => 'Boutique non trouvée'
                ], 404);
            }

            // Utiliser le service pour obtenir le nombre de vues
            $totalViews = $this->statsService->getTotalViews($boutique);

            Log::info('Compteur de vues public récupéré', [
                'boutique_id' => $boutique->id,
                'total_views' => $totalViews
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'boutique_id' => $boutique->id,
                    'boutique_name' => $boutique->nom,
                    'boutique_slug' => $boutique->slug,
                    'total_views' => (int) $totalViews,
                    'count' => (int) $totalViews
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération du compteur de vues public', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du compteur de vues',
                'error' => config('app.debug') ? $e->getMessage() : 'Une erreur est survenue'
            ], 500);
        }
    }

    /**
     * Enregistrer une vue de boutique par slug avec validation corrigée
     */
    public function recordViewBySlug(Request $request, $slug)
    {
        try {
            // Validation du slug
            if (empty($slug) || !is_string($slug)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Slug de boutique invalide'
                ], 400);
            }

            // Validation des données avec les nouvelles règles
            $validatedData = $request->validate($this->getViewValidationRules());

            // Récupérer la boutique par slug
            $boutique = Boutique::where('slug', $slug)
                ->where('status', 'active')
                ->first();

            if (!$boutique) {
                Log::info('Boutique non trouvée pour enregistrement de vue', ['slug' => $slug]);
                return response()->json([
                    'success' => false,
                    'message' => 'Boutique non trouvée'
                ], 404);
            }

            // Préparer les données pour l'enregistrement
            $viewData = [
                'boutique_id' => $boutique->id,
                'ip_address' => $request->input('ip_address', $request->ip()),
                'user_agent' => $request->input('user_agent', $request->userAgent()),
                'referrer' => $request->input('referrer', $request->header('referer')),
                'country' => $request->input('country'),
                'city' => $request->input('city'),
                'device_type' => $request->input('device_type'),
                'browser' => $request->input('browser'),
                'os' => $request->input('os'),
                'viewed_at' => $request->input('viewed_at', now()),
                'force_record' => $request->input('force_record', false),
                'bypass_dedup' => $request->input('bypass_dedup', false)
            ];

            // Forcer l'enregistrement si demandé
            $forceRecord = $request->input('force_record', false) || 
                          $request->input('bypass_dedup', false);
            
            if ($forceRecord) {
                $viewRecorded = $this->statsService->recordViewForced($boutique, $viewData);
                Log::info('Enregistrement de vue FORCÉ', [
                    'boutique_id' => $boutique->id,
                    'boutique_slug' => $slug,
                    'view_recorded' => $viewRecorded,
                    'ip' => $viewData['ip_address'],
                    'force_mode' => true
                ]);
            } else {
                $viewRecorded = $this->statsService->recordView($boutique, $viewData);
                Log::info('Enregistrement de vue STANDARD', [
                    'boutique_id' => $boutique->id,
                    'boutique_slug' => $slug,
                    'view_recorded' => $viewRecorded,
                    'ip' => $viewData['ip_address']
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => $viewRecorded ? 'Vue enregistrée avec succès' : 'Vue déjà enregistrée récemment',
                'data' => [
                    'boutique_id' => $boutique->id,
                    'boutique_name' => $boutique->nom,
                    'boutique_slug' => $boutique->slug,
                    'view_recorded' => $viewRecorded,
                    'timestamp' => now()->toISOString(),
                    'forced' => $forceRecord
                ]
            ]);

        } catch (ValidationException $e) {
            Log::error('Erreur de validation pour enregistrement de vue', [
                'slug' => $slug,
                'errors' => $e->errors(),
                'input' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Données de requête invalides',
                'errors' => $e->errors(),
                'debug_info' => config('app.debug') ? [
                    'received_fields' => array_keys($request->all()),
                    'validation_rules' => array_keys($this->getViewValidationRules())
                ] : null
            ], 422);

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'enregistrement de la vue par slug', [
                'slug' => $slug,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement de la vue',
                'error' => config('app.debug') ? $e->getMessage() : 'Une erreur est survenue',
                'data' => [
                    'view_recorded' => false
                ]
            ], 500);
        }
    }

    /**
     * Enregistrer une vue de boutique par slug FORCÉE - VERSION CORRIGÉE
     */
    public function recordViewBySlugForced(Request $request, $slug)
    {
        try {
            // Validation du slug
            if (empty($slug) || !is_string($slug)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Slug de boutique invalide'
                ], 400);
            }

            // Validation des données avec règles étendues
            $validatedData = $request->validate($this->getViewValidationRules());

            // Récupérer la boutique par slug
            $boutique = Boutique::where('slug', $slug)
                ->where('status', 'active')
                ->first();

            if (!$boutique) {
                Log::info('Boutique non trouvée pour enregistrement de vue forcé', ['slug' => $slug]);
                return response()->json([
                    'success' => false,
                    'message' => 'Boutique non trouvée'
                ], 404);
            }

            // Préparer les données pour l'enregistrement forcé
            $viewData = [
                'boutique_id' => $boutique->id,
                'ip_address' => $request->input('ip_address', $request->ip()),
                'user_agent' => $request->input('user_agent', $request->userAgent()),
                'referrer' => $request->input('referrer', $request->header('referer')),
                'country' => $request->input('country'),
                'city' => $request->input('city'),
                'device_type' => $request->input('device_type'),
                'browser' => $request->input('browser'),
                'os' => $request->input('os'),
                'viewed_at' => $request->input('viewed_at', now()),
                'force_record' => true,
                'bypass_dedup' => true
            ];

            // Enregistrer la vue FORCÉE - toujours forcer
            $viewRecorded = $this->statsService->recordViewForced($boutique, $viewData);

            Log::info('Enregistrement de vue FORCÉ réussi', [
                'boutique_id' => $boutique->id,
                'boutique_slug' => $slug,
                'view_recorded' => $viewRecorded,
                'ip' => $viewData['ip_address'],
                'force_mode' => true,
                'method' => 'recordViewBySlugForced'
            ]);

            return response()->json([
                'success' => true,
                'message' => $viewRecorded ? 'Vue enregistrée avec succès (forcé)' : 'Échec de l\'enregistrement forcé',
                'data' => [
                    'boutique_id' => $boutique->id,
                    'boutique_name' => $boutique->nom,
                    'boutique_slug' => $boutique->slug,
                    'view_recorded' => $viewRecorded,
                    'timestamp' => now()->toISOString(),
                    'forced' => true
                ]
            ]);

        } catch (ValidationException $e) {
            Log::error('Erreur de validation pour enregistrement forcé', [
                'slug' => $slug,
                'errors' => $e->errors(),
                'input' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Données de requête invalides pour enregistrement forcé',
                'errors' => $e->errors(),
                'debug_info' => config('app.debug') ? [
                    'received_fields' => array_keys($request->all()),
                    'validation_rules' => array_keys($this->getViewValidationRules())
                ] : null
            ], 422);

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'enregistrement de la vue forcé par slug', [
                'slug' => $slug,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement de la vue forcé',
                'error' => config('app.debug') ? $e->getMessage() : 'Une erreur est survenue',
                'data' => [
                    'view_recorded' => false
                ]
            ], 500);
        }
    }

    /**
     * Enregistrer une vue de boutique par slug AVEC DONNÉES ÉTENDUES - VERSION CORRIGÉE
     */
    public function recordViewBySlugExtended(Request $request, $slug)
    {
        try {
            // Validation du slug
            if (empty($slug) || !is_string($slug)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Slug de boutique invalide'
                ], 400);
            }

            // Validation étendue des données avec toutes les règles
            $validatedData = $request->validate($this->getViewValidationRules());

            // Récupérer la boutique par slug
            $boutique = Boutique::where('slug', $slug)
                ->where('status', 'active')
                ->first();

            if (!$boutique) {
                Log::info('Boutique non trouvée pour enregistrement de vue étendu', ['slug' => $slug]);
                return response()->json([
                    'success' => false,
                    'message' => 'Boutique non trouvée'
                ], 404);
            }

            // Préparer les données pour l'enregistrement étendu
            $viewData = [
                'boutique_id' => $boutique->id,
                'ip_address' => $request->input('ip_address', $request->ip()),
                'user_agent' => $request->input('user_agent', $request->userAgent()),
                'referrer' => $request->input('referrer', $request->header('referer')),
                'country' => $request->input('country'),
                'city' => $request->input('city'),
                'device_type' => $request->input('device_type'),
                'browser' => $request->input('browser'),
                'os' => $request->input('os'),
                'viewed_at' => $request->input('viewed_at', now()),
                'force_record' => $request->input('force_record', false),
                'bypass_dedup' => $request->input('bypass_dedup', false)
            ];

            // Enregistrer la vue avec données étendues
            $viewRecorded = $this->statsService->recordViewExtended($boutique, $viewData);

            Log::info('Enregistrement de vue ÉTENDU réussi', [
                'boutique_id' => $boutique->id,
                'boutique_slug' => $slug,
                'view_recorded' => $viewRecorded,
                'ip' => $viewData['ip_address'],
                'extended_data' => true,
                'data_count' => count($validatedData)
            ]);

            return response()->json([
                'success' => true,
                'message' => $viewRecorded ? 'Vue enregistrée avec données étendues' : 'Vue déjà enregistrée récemment',
                'data' => [
                    'boutique_id' => $boutique->id,
                    'boutique_name' => $boutique->nom,
                    'boutique_slug' => $boutique->slug,
                    'view_recorded' => $viewRecorded,
                    'timestamp' => now()->toISOString(),
                    'extended_data' => true,
                    'validation_passed' => true
                ]
            ]);

        } catch (ValidationException $e) {
            Log::error('Erreur de validation pour enregistrement étendu', [
                'slug' => $slug,
                'errors' => $e->errors(),
                'input' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Données de requête invalides pour enregistrement étendu',
                'errors' => $e->errors(),
                'debug_info' => config('app.debug') ? [
                    'received_fields' => array_keys($request->all()),
                    'field_lengths' => array_map(function($value) {
                        return is_string($value) ? strlen($value) : gettype($value);
                    }, $request->all())
                ] : null
            ], 422);

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'enregistrement de la vue étendu par slug', [
                'slug' => $slug,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement de la vue étendu',
                'error' => config('app.debug') ? $e->getMessage() : 'Une erreur est survenue',
                'data' => [
                    'view_recorded' => false
                ]
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques complètes d'une boutique (avec authentification)
     */
    public function getBoutiqueStats(Request $request, $id)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentification requise'
                ], 401);
            }

            $boutique = $user->boutiques()->where('id', $id)->first();

            if (!$boutique) {
                return response()->json([
                    'success' => false,
                    'message' => 'Boutique non trouvée ou accès non autorisé',
                    'data' => []
                ], 404);
            }

            $period = $request->get('period', 'month');
            $stats = $this->statsService->getCompleteStats($boutique, $period);

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des statistiques complètes', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => config('app.debug') ? $e->getMessage() : 'Une erreur est survenue'
            ], 500);
        }
    }

    /**
     * Obtenir le nombre de vues avec authentification (PRIVÉ)
     */
    public function getViewCount(Request $request, $id)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentification requise'
                ], 401);
            }

            $boutique = $user->boutiques()->where('id', $id)->first();

            if (!$boutique) {
                return response()->json([
                    'success' => false,
                    'message' => 'Boutique non trouvée ou accès non autorisé'
                ], 404);
            }

            $totalViews = $this->statsService->getTotalViews($boutique);

            return response()->json([
                'success' => true,
                'data' => [
                    'total_views' => (int) $totalViews,
                    'count' => (int) $totalViews
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération du compteur de vues', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du compteur de vues',
                'error' => config('app.debug') ? $e->getMessage() : 'Une erreur est survenue'
            ], 500);
        }
    }

    /**
     * Test de santé des statistiques
     */
    public function healthCheck()
    {
        try {
            // Tester la connexion à la base de données
            $testQuery = \DB::select('SELECT 1 as test');
            
            return response()->json([
                'success' => true,
                'message' => 'Service de statistiques opérationnel',
                'data' => [
                    'database' => 'OK',
                    'timestamp' => now()->toISOString(),
                    'version' => '1.0.0'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Service de statistiques non disponible',
                'error' => $e->getMessage()
            ], 503);
        }
    }

    /**
     * Endpoint de debug pour tester la validation
     */
    public function debugValidation(Request $request, $slug)
    {
        try {
            $allInput = $request->all();
            $rules = $this->getViewValidationRules();
            
            // Tester la validation sans la faire échouer
            $validator = \Validator::make($allInput, $rules);
            
            $result = [
                'success' => true,
                'slug' => $slug,
                'validation_passed' => !$validator->fails(),
                'input_fields' => array_keys($allInput),
                'validation_rules' => array_keys($rules),
                'field_analysis' => []
            ];

            // Analyser chaque champ
            foreach ($allInput as $field => $value) {
                $analysis = [
                    'field' => $field,
                    'value_type' => gettype($value),
                    'value_length' => is_string($value) ? strlen($value) : null,
                    'has_validation_rule' => array_key_exists($field, $rules),
                    'validation_rule' => $rules[$field] ?? 'none'
                ];

                if (is_string($value) && isset($rules[$field])) {
                    $rule = $rules[$field];
                    if (preg_match('/max:(\d+)/', $rule, $matches)) {
                        $maxLength = (int) $matches[1];
                        $analysis['max_allowed'] = $maxLength;
                        $analysis['exceeds_limit'] = strlen($value) > $maxLength;
                    }
                }

                $result['field_analysis'][] = $analysis;
            }

            if ($validator->fails()) {
                $result['validation_errors'] = $validator->errors()->toArray();
            }

            return response()->json($result);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du debug de validation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir des statistiques vides par défaut
     */
    private function getEmptyStats()
    {
        return [
            'total_views' => 0,
            'unique_views' => 0,
            'previous_views' => 0,
            'growth' => 0
        ];
    }
}