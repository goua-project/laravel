<?php

// app/Http/Controllers/Api/PlanAbonnementController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlanAbonnement;
use App\Models\Abonnement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class PlanAbonnementController extends Controller
{


     
    /**
     * Lister tous les plans (admin)
     */
    public function adminIndex()
    {
        try {
            $plans = PlanAbonnement::withCount(['abonnements' => function($query) {
                $query->where('statut', 'actif');
            }])->get();
            
            return response()->json([
                'success' => true,
                'data' => $plans
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des plans',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Créer un nouveau plan (admin)
     */
    public function adminStore(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'nom' => 'required|string|max:255|unique:plan_abonnements',
                'slug' => 'required|string|max:255|unique:plan_abonnements',
                'description' => 'nullable|string',
                'prix' => 'required|numeric|min:0',
                'duree_mois' => 'required|integer|min:1',
                'limite_produits' => 'required|integer|min:-1', // -1 pour illimité
                'features' => 'nullable|array',
                'commission' => 'required|numeric|min:0|max:100',
                'is_active' => 'boolean',
                'is_popular' => 'boolean'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $plan = PlanAbonnement::create($request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Plan créé avec succès',
                'data' => $plan
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du plan',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Afficher un plan spécifique (admin)
     */
    public function adminShow($id)
    {
        try {
            $plan = PlanAbonnement::with(['abonnements' => function($query) {
                $query->where('statut', 'actif');
            }])->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $plan
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Plan non trouvé',
                'error' => $e->getMessage()
            ], 404);
        }
    }
    
    /**
     * Mettre à jour un plan (admin)
     */
    public function adminUpdate(Request $request, $id)
    {
        try {
            $plan = PlanAbonnement::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'nom' => 'sometimes|required|string|max:255|unique:plan_abonnements,nom,' . $id,
                'slug' => 'sometimes|required|string|max:255|unique:plan_abonnements,slug,' . $id,
                'description' => 'nullable|string',
                'prix' => 'sometimes|required|numeric|min:0',
                'duree_mois' => 'sometimes|required|integer|min:1',
                'limite_produits' => 'sometimes|required|integer|min:-1',
                'features' => 'nullable|array',
                'commission' => 'sometimes|required|numeric|min:0|max:100',
                'is_active' => 'boolean',
                'is_popular' => 'boolean'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $plan->update($request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Plan mis à jour avec succès',
                'data' => $plan
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du plan',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Supprimer un plan (admin)
     */
    public function adminDestroy($id)
    {
        try {
            $plan = PlanAbonnement::findOrFail($id);
            
            // Vérifier si le plan est utilisé par des abonnements actifs
            if ($plan->abonnements()->where('statut', 'actif')->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer ce plan car il est utilisé par des abonnements actifs'
                ], 422);
            }
            
            $plan->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Plan supprimé avec succès'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du plan',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Activer/désactiver un plan (admin)
     */
    public function adminToggleStatus($id)
    {
        try {
            $plan = PlanAbonnement::findOrFail($id);
            $plan->is_active = !$plan->is_active;
            $plan->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Statut du plan mis à jour avec succès',
                'data' => $plan
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification du statut',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Afficher tous les plans d'abonnement disponibles
     */
    public function index()
    {
        try {
            $plans = PlanAbonnement::where('is_active', true)
                ->orderBy('prix')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $plans,
                'message' => 'Plans d\'abonnement récupérés avec succès'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des plans',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher un plan spécifique
     */

    /**
 * Obtenir l'abonnement actuel de l'utilisateur connecté
 */
/**
 * Obtenir l'abonnement actuel de l'utilisateur connecté
 */
public function getCurrentSubscription()
{
    try {
        $currentSubscription = Abonnement::with('plan')
            ->where('user_id', Auth::id())
            ->where('statut', 'actif')
            ->first();

        if (!$currentSubscription) {
            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'Aucun abonnement actif trouvé'
            ], 200);
        }

        // Calculer les jours restants
        $daysRemaining = null;
        if ($currentSubscription->date_fin) {
            try {
                // S'assurer que date_fin est un objet Carbon
                $dateFin = \Carbon\Carbon::parse($currentSubscription->date_fin);
                $now = \Carbon\Carbon::now();
                $daysRemaining = $now->diffInDays($dateFin, false);
            } catch (\Exception $e) {
                // En cas d'erreur de parsing, on ignore le calcul
                $daysRemaining = null;
            }
        }

        $subscriptionData = [
            'id' => $currentSubscription->id,
            'plan' => [
                'id' => $currentSubscription->plan->id,
                'nom' => $currentSubscription->plan->nom,
                'slug' => $currentSubscription->plan->slug,
                'prix' => $currentSubscription->plan->prix,
                'description' => $currentSubscription->plan->description,
                'features' => $currentSubscription->plan->features,
                'limite_produits' => $currentSubscription->plan->limite_produits,
                'commission' => $currentSubscription->plan->commission,
                'is_free' => $currentSubscription->plan->is_free,
            ],
            'date_debut' => $currentSubscription->date_debut,
            'date_fin' => $currentSubscription->date_fin,
            'statut' => $currentSubscription->statut,
            'is_active' => $currentSubscription->isActive(),
            'reference_paiement' => $currentSubscription->reference_paiement,
            'days_remaining' => $daysRemaining !== null && $daysRemaining > 0 ? $daysRemaining : 0,
            'is_expired' => $daysRemaining !== null && $daysRemaining < 0,
            'expires_soon' => $daysRemaining !== null && $daysRemaining >= 0 && $daysRemaining <= 7,
        ];

        return response()->json([
            'success' => true,
            'data' => $subscriptionData,
            'message' => 'Abonnement actuel récupéré avec succès'
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la récupération de l\'abonnement actuel',
            'error' => $e->getMessage()
        ], 500);
    }
}
    public function show($id)
    {
        try {
            $plan = PlanAbonnement::where('is_active', true)->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $plan,
                'message' => 'Plan récupéré avec succès'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Plan non trouvé'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du plan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir le plan par slug
     */
    public function showBySlug($slug)
    {
        try {
            $plan = PlanAbonnement::where('slug', $slug)
                ->where('is_active', true)
                ->firstOrFail();

            return response()->json([
                'success' => true,
                'data' => $plan,
                'message' => 'Plan récupéré avec succès'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Plan non trouvé'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du plan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Comparer les plans (pour affichage côte à côte)
     */
    public function compare(Request $request)
    {
        try {
            $request->validate([
                'plan_ids' => 'required|array|min:2|max:4',
                'plan_ids.*' => 'required|exists:plans_abonnement,id'
            ]);

            $plans = PlanAbonnement::whereIn('id', $request->plan_ids)
                ->where('is_active', true)
                ->get();

            $comparison = $plans->map(function ($plan) {
                return [
                    'id' => $plan->id,
                    'nom' => $plan->nom,
                    'slug' => $plan->slug,
                    'prix' => $plan->prix,
                    'description' => $plan->description,
                    'features' => $plan->features,
                    'limitations' => [
                        'limite_produits' => $plan->limite_produits,
                        'commission' => $plan->commission,
                    ],
                    'is_free' => $plan->is_free,
                    'is_popular' => $plan->slug === 'pro', // Ou une autre logique
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $comparison,
                'message' => 'Comparaison des plans générée avec succès'
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la comparaison des plans',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir l'historique des abonnements de l'utilisateur
     */
    public function getUserSubscriptionHistory()
    {
        try {
            $abonnements = Abonnement::with('plan')
                ->where('user_id', Auth::id())
                ->orderBy('created_at', 'desc')
                ->get();

            $history = $abonnements->map(function ($abonnement) {
                return [
                    'id' => $abonnement->id,
                    'plan' => [
                        'nom' => $abonnement->plan->nom,
                        'prix' => $abonnement->plan->prix,
                    ],
                    'date_debut' => $abonnement->date_debut,
                    'date_fin' => $abonnement->date_fin,
                    'statut' => $abonnement->statut,
                    'duree_jours' => $abonnement->date_debut->diffInDays($abonnement->date_fin),
                    'is_active' => $abonnement->isActive(),
                    'reference_paiement' => $abonnement->reference_paiement,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $history,
                'message' => 'Historique des abonnements récupéré avec succès'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'historique',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculer le prix pour une durée donnée
     */
    public function calculatePrice(Request $request, $planId)
    {
        try {
            $request->validate([
                'duree_mois' => 'required|integer|min:1|max:12'
            ]);

            $plan = PlanAbonnement::where('is_active', true)->findOrFail($planId);

            if ($plan->is_free) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'plan_id' => $plan->id,
                        'plan_nom' => $plan->nom,
                        'prix_mensuel' => 0,
                        'duree_mois' => $request->duree_mois,
                        'prix_total' => 0,
                        'economie' => 0
                    ],
                    'message' => 'Prix calculé avec succès'
                ], 200);
            }

            $prixMensuel = $plan->prix;
            $dureeMois = $request->duree_mois;
            $prixTotal = $prixMensuel * $dureeMois;

            // Appliquer des remises pour les abonnements longs
            $remise = 0;
            if ($dureeMois >= 12) {
                $remise = 0.20; // 20% de remise pour 12 mois
            } elseif ($dureeMois >= 6) {
                $remise = 0.10; // 10% de remise pour 6 mois
            } elseif ($dureeMois >= 3) {
                $remise = 0.05; // 5% de remise pour 3 mois
            }

            $prixAvecRemise = $prixTotal * (1 - $remise);
            $economie = $prixTotal - $prixAvecRemise;

            return response()->json([
                'success' => true,
                'data' => [
                    'plan_id' => $plan->id,
                    'plan_nom' => $plan->nom,
                    'prix_mensuel' => $prixMensuel,
                    'duree_mois' => $dureeMois,
                    'prix_sans_remise' => $prixTotal,
                    'remise_pourcentage' => $remise * 100,
                    'prix_total' => round($prixAvecRemise),
                    'economie' => round($economie)
                ],
                'message' => 'Prix calculé avec succès'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Plan non trouvé'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul du prix',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les recommandations de plan pour un utilisateur
     */
    public function getRecommendations()
    {
        try {
            // Logique simple de recommandation
            // Vous pouvez l'améliorer en fonction du profil utilisateur
            
            $currentSubscription = Abonnement::with('plan')
                ->where('user_id', Auth::id())
                ->where('statut', 'actif')
                ->first();

            $allPlans = PlanAbonnement::where('is_active', true)
                ->orderBy('prix')
                ->get();

            $recommendations = [];

            if (!$currentSubscription || $currentSubscription->plan->is_free) {
                // Utilisateur sur plan gratuit -> recommander Pro
                $recommendations[] = [
                    'plan_id' => $allPlans->where('slug', 'pro')->first()->id ?? null,
                    'raison' => 'Idéal pour développer votre activité',
                    'avantages' => ['Produits illimités', 'Zéro commission', 'Support prioritaire']
                ];
            } elseif ($currentSubscription->plan->slug === 'pro') {
                // Utilisateur Pro -> recommander Business si pertinent
                $recommendations[] = [
                    'plan_id' => $allPlans->where('slug', 'business')->first()->id ?? null,
                    'raison' => 'Pour une approche plus professionnelle',
                    'avantages' => ['Multi-utilisateurs', 'Rapports avancés', 'Support dédié']
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'current_plan' => $currentSubscription ? [
                        'id' => $currentSubscription->plan->id,
                        'nom' => $currentSubscription->plan->nom,
                        'expires_at' => $currentSubscription->date_fin
                    ] : null,
                    'recommendations' => $recommendations,
                    'all_plans' => $allPlans
                ],
                'message' => 'Recommandations générées avec succès'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération des recommandations',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}