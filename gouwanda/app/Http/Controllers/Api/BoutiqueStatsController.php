<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Boutique;
use App\Services\BoutiqueStatsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BoutiqueStatsController extends Controller
{
    protected $statsService;

    public function __construct(BoutiqueStatsService $statsService)
    {
        $this->statsService = $statsService;
    }

    /**
     * Enregistrer une vue de boutique par slug
     */
    public function recordViewBySlug(Request $request, $slug)
    {
        try {
            // Récupérer la boutique par slug
            $boutique = Boutique::where('slug', $slug)
                ->where('status', 'active')
                ->first();

            if (!$boutique) {
                return response()->json([
                    'success' => false,
                    'message' => 'Boutique non trouvée'
                ], 404);
            }

            // Enregistrer la vue
            $viewRecorded = $this->statsService->recordView($boutique, $request);

            return response()->json([
                'success' => true,
                'message' => $viewRecorded ? 'Vue enregistrée avec succès' : 'Vue déjà enregistrée récemment',
                'data' => [
                    'boutique_id' => $boutique->id,
                    'boutique_name' => $boutique->nom,
                    'view_recorded' => $viewRecorded
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'enregistrement de la vue:', [
                'slug' => $slug,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement de la vue',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Enregistrer une vue de boutique par ID
     */
    public function recordViewById(Request $request, $id)
    {
        try {
            $boutique = Boutique::where('id', $id)
                ->where('status', 'active')
                ->first();

            if (!$boutique) {
                return response()->json([
                    'success' => false,
                    'message' => 'Boutique non trouvée'
                ], 404);
            }

            $viewRecorded = $this->statsService->recordView($boutique, $request);

            return response()->json([
                'success' => true,
                'message' => $viewRecorded ? 'Vue enregistrée avec succès' : 'Vue déjà enregistrée récemment',
                'data' => [
                    'boutique_id' => $boutique->id,
                    'boutique_name' => $boutique->nom,
                    'view_recorded' => $viewRecorded
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'enregistrement de la vue:', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement de la vue',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques complètes d'une boutique
     */
    public function getBoutiqueStats(Request $request, $id)
    {
        try {
            // Vérifier que l'utilisateur a accès à cette boutique
            $user = $request->user();
            $boutique = $user->boutiques()->where('id', $id)->first();

            if (!$boutique) {
                return response()->json([
                    'success' => false,
                    'message' => 'Boutique non trouvée ou accès non autorisé'
                ], 404);
            }

            $period = $request->get('period', 'month');
            $stats = $this->statsService->getCompleteStats($boutique, $period);

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des statistiques:', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques du dashboard pour une boutique
     */
    public function getDashboardStats(Request $request, $id)
    {
        try {
            // Vérifier que l'utilisateur a accès à cette boutique
            $user = $request->user();
            $boutique = $user->boutiques()->where('id', $id)->first();

            if (!$boutique) {
                return response()->json([
                    'success' => false,
                    'message' => 'Boutique non trouvée ou accès non autorisé'
                ], 404);
            }

            $period = $request->get('period', 'month');
            $stats = $this->statsService->getViewStats($boutique, $period);

            return response()->json([
                'success' => true,
                'data' => [
                    'total_views' => $stats['total_views'],
                    'previous_views' => $stats['previous_views'],
                    'growth_rate' => $stats['growth'],
                    'unique_views' => $stats['unique_views']
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des statistiques dashboard:', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques de vues spécifiques
     */
    public function getViewsStats(Request $request, $id)
    {
        try {
            $user = $request->user();
            $boutique = $user->boutiques()->where('id', $id)->first();

            if (!$boutique) {
                return response()->json([
                    'success' => false,
                    'message' => 'Boutique non trouvée ou accès non autorisé'
                ], 404);
            }

            $period = $request->get('period', 'month');
            $stats = $this->statsService->getViewStats($boutique, $period);
            $chartData = $this->statsService->getCompleteStats($boutique, $period);

            return response()->json([
                'success' => true,
                'data' => [
                    'total_views' => $stats['total_views'],
                    'unique_views' => $stats['unique_views'],
                    'previous_views' => $stats['previous_views'],
                    'growth_rate' => $stats['growth'],
                    'views_by_period' => $chartData['chart_data'] ?? []
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des statistiques de vues:', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques de toutes les boutiques de l'utilisateur
     */
    public function getAllBoutiquesStats(Request $request)
    {
        try {
            $user = $request->user();
            $period = $request->get('period', 'month');

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }

            $boutiques = $user->boutiques()->where('status', 'active')->get();
            $allStats = [];

            foreach ($boutiques as $boutique) {
                $stats = $this->statsService->getViewStats($boutique, $period);
                $allStats[] = [
                    'boutique_id' => $boutique->id,
                    'boutique_name' => $boutique->nom,
                    'boutique_slug' => $boutique->slug,
                    'stats' => $stats
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $allStats
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération de toutes les statistiques:', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques par appareil
     */
    public function getDeviceStats(Request $request, $id)
    {
        try {
            $user = $request->user();
            $boutique = $user->boutiques()->where('id', $id)->first();

            if (!$boutique) {
                return response()->json([
                    'success' => false,
                    'message' => 'Boutique non trouvée ou accès non autorisé'
                ], 404);
            }

            $period = $request->get('period', 'month');
            $deviceStats = $this->statsService->getDeviceStats($boutique, $period);

            return response()->json([
                'success' => true,
                'data' => $deviceStats
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des statistiques par appareil:', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques par navigateur
     */
    public function getBrowserStats(Request $request, $id)
    {
        try {
            $user = $request->user();
            $boutique = $user->boutiques()->where('id', $id)->first();

            if (!$boutique) {
                return response()->json([
                    'success' => false,
                    'message' => 'Boutique non trouvée ou accès non autorisé'
                ], 404);
            }

            $period = $request->get('period', 'month');
            $browserStats = $this->statsService->getBrowserStats($boutique, $period);

            return response()->json([
                'success' => true,
                'data' => $browserStats
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des statistiques par navigateur:', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}