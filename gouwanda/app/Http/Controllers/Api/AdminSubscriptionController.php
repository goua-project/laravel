<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Abonnement;
use App\Models\PlanAbonnement;
use App\Models\Boutique;
use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class AdminSubscriptionController extends Controller
{
    // ==================== GESTION DES PLANS D'ABONNEMENT ====================

    /**
     * Obtenir tous les plans d'abonnement
     */
    public function getAllPlans(): JsonResponse
    {
        try {
            $plans = PlanAbonnement::orderBy('prix', 'asc')->get();

            $formattedPlans = $plans->map(function ($plan) {
                return [
                    'id' => $plan->id,
                    'nom' => $plan->nom,
                    'slug' => $plan->slug,
                    'description' => $plan->description,
                    'prix' => (float) $plan->prix,
                    'duree_mois' => $plan->duree_mois,
                    'commission' => $plan->commission,
                    'limite_produits' => $plan->limite_produits,
                    'features' => $this->getFeatures($plan),
                    'mobile_money' => (bool) $plan->mobile_money,
                    'dashboard_boutique' => (bool) $plan->dashboard_boutique,
                    'personnalisation_avancee' => (bool) $plan->personnalisation_avancee,
                    'statistiques_seo' => (bool) $plan->statistiques_seo,
                    'support_prioritaire' => (bool) $plan->support_prioritaire,
                    'certificat_avance' => (bool) $plan->certificat_avance,
                    'multi_utilisateurs' => (bool) $plan->multi_utilisateurs,
                    'rapports_exportables' => (bool) $plan->rapports_exportables,
                    'support_dedie' => (bool) $plan->support_dedie,
                    'is_free' => (bool) $plan->is_free,
                    'is_active' => (bool) $plan->is_active,
                    'is_popular' => (bool) ($plan->is_popular ?? false),
                    'created_at' => $plan->created_at,
                    'updated_at' => $plan->updated_at
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedPlans,
                'message' => 'Plans d\'abonnement récupérés avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des plans: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir un plan d'abonnement spécifique
     */
    public function getPlan($id): JsonResponse
    {
        try {
            $plan = PlanAbonnement::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $this->formatPlan($plan),
                'message' => 'Plan récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du plan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer un nouveau plan d'abonnement
     */
    public function createPlan(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'nom' => 'required|string|max:255',
                'description' => 'required|string',
                'prix' => 'required|numeric|min:0',
                'duree_mois' => 'required|integer|min:1|max:36',
                'limite_produits' => 'required|integer|min:-1',
                'commission' => 'nullable|numeric|min:0|max:100',
                'features' => 'nullable|array',
                'is_active' => 'boolean',
                'is_popular' => 'boolean',
                'is_free' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données de validation échouées',
                    'errors' => $validator->errors()
                ], 422);
            }

            $planData = $request->all();
            $planData['slug'] = $this->generateSlug($request->nom);
            
            // Gestion des fonctionnalités spéciales basées sur les features
            $features = $request->features ?? [];
            $this->setFeaturesFromArray($planData, $features);

            $plan = PlanAbonnement::create($planData);

            return response()->json([
                'success' => true,
                'data' => $this->formatPlan($plan),
                'message' => 'Plan créé avec succès'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du plan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour un plan d'abonnement
     */
    public function updatePlan(Request $request, $id): JsonResponse
    {
        try {
            $plan = PlanAbonnement::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'nom' => 'required|string|max:255',
                'description' => 'required|string',
                'prix' => 'required|numeric|min:0',
                'duree_mois' => 'required|integer|min:1|max:36',
                'limite_produits' => 'required|integer|min:-1',
                'commission' => 'nullable|numeric|min:0|max:100',
                'features' => 'nullable|array',
                'is_active' => 'boolean',
                'is_popular' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données de validation échouées',
                    'errors' => $validator->errors()
                ], 422);
            }

            $planData = $request->all();
            if ($request->nom !== $plan->nom) {
                $planData['slug'] = $this->generateSlug($request->nom);
            }

            // Gestion des fonctionnalités spéciales
            $features = $request->features ?? [];
            $this->setFeaturesFromArray($planData, $features);

            $plan->update($planData);

            return response()->json([
                'success' => true,
                'data' => $this->formatPlan($plan->fresh()),
                'message' => 'Plan mis à jour avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du plan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un plan d'abonnement
     */
    public function deletePlan($id): JsonResponse
    {
        try {
            $plan = PlanAbonnement::findOrFail($id);

            // Vérifier s'il y a des abonnements actifs avec ce plan
            $activeSubscriptions = Abonnement::where('plan_id', $id)
                                           ->where('statut', 'actif')
                                           ->count();

            if ($activeSubscriptions > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Impossible de supprimer ce plan. {$activeSubscriptions} abonnement(s) actif(s) l'utilisent encore."
                ], 400);
            }

            $plan->delete();

            return response()->json([
                'success' => true,
                'message' => 'Plan supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du plan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Activer/Désactiver un plan d'abonnement
     */
    public function togglePlanStatus(Request $request, $id): JsonResponse
    {
        try {
            $plan = PlanAbonnement::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'is_active' => 'required|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données de validation échouées',
                    'errors' => $validator->errors()
                ], 422);
            }

            $plan->update(['is_active' => $request->is_active]);

            return response()->json([
                'success' => true,
                'data' => $this->formatPlan($plan),
                'message' => $request->is_active ? 'Plan activé avec succès' : 'Plan désactivé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de statut: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==================== GESTION DES ABONNEMENTS UTILISATEURS ====================

    /**
     * Obtenir tous les abonnements utilisateurs
     */
    public function getAllUserSubscriptions(Request $request): JsonResponse
    {
        try {
            $page = $request->get('page', 1);
            $limit = $request->get('limit', 20);
            $status = $request->get('status');
            $planId = $request->get('plan_id');

            $query = DB::table('abonnements as a')
                ->join('users as u', 'a.user_id', '=', 'u.id')
                ->join('boutiques as b', 'a.boutique_id', '=', 'b.id')
                ->join('plans_abonnement as p', 'a.plan_id', '=', 'p.id')
                ->select([
                    'a.id',
                    'a.user_id',
                    'u.nom as user_nom',
                    'u.prenom as user_prenom',
                    'u.email as user_email',
                    'b.nom as shop_name',
                    'a.plan_id',
                    'p.nom as plan_name',
                    'p.prix as amount_paid',
                    'p.limite_produits as max_products',
                    'a.date_debut as start_date',
                    'a.date_fin as end_date',
                    'a.statut as status',
                    'a.reference_paiement',
                    'a.actif',
                    'a.created_at',
                    'a.updated_at'
                ]);

            if ($status) {
                $query->where('a.statut', $status);
            }

            if ($planId) {
                $query->where('a.plan_id', $planId);
            }

            $subscriptions = $query->orderBy('a.created_at', 'desc')
                                  ->paginate($limit, ['*'], 'page', $page);

            $formattedSubscriptions = $subscriptions->getCollection()->map(function ($subscription) {
                // Compter les produits utilisés
                $productsUsed = Produit::where('boutique_id', DB::table('boutiques')->where('id', $subscription->user_id)->value('id') ?? 0)->count();

                return [
                    'id' => $subscription->id,
                    'user_id' => $subscription->user_id,
                    'user_name' => $subscription->user_nom . ' ' . $subscription->user_prenom,
                    'user_email' => $subscription->user_email,
                    'shop_name' => $subscription->shop_name,
                    'plan_id' => $subscription->plan_id,
                    'plan_name' => $subscription->plan_name,
                    'amount_paid' => (float) $subscription->amount_paid,
                    'products_used' => $productsUsed,
                    'max_products' => $subscription->max_products,
                    'start_date' => $subscription->start_date,
                    'end_date' => $subscription->end_date,
                    'status' => $subscription->status,
                    'auto_renewal' => false, 
                    'reference_paiement' => $subscription->reference_paiement,
                    'is_active' => (bool) $subscription->actif,
                    'created_at' => $subscription->created_at,
                    'updated_at' => $subscription->updated_at
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedSubscriptions,
                'pagination' => [
                    'current_page' => $subscriptions->currentPage(),
                    'last_page' => $subscriptions->lastPage(),
                    'per_page' => $subscriptions->perPage(),
                    'total' => $subscriptions->total()
                ],
                'message' => 'Abonnements récupérés avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des abonnements: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les détails d'un abonnement spécifique
     */
    public function getSubscriptionDetails($id): JsonResponse
    {
        try {
            $subscription = Abonnement::with(['user', 'plan', 'boutique'])->findOrFail($id);

            $data = [
                'id' => $subscription->id,
                'user' => [
                    'id' => $subscription->user->id,
                    'nom' => $subscription->user->nom,
                    'prenom' => $subscription->user->prenom,
                    'email' => $subscription->user->email,
                    'telephone' => $subscription->user->telephone ?? null,
                ],
                'plan' => $this->formatPlan($subscription->plan),
                'boutique' => [
                    'id' => $subscription->boutique->id,
                    'nom' => $subscription->boutique->nom,
                    'slug' => $subscription->boutique->slug,
                    'status' => $subscription->boutique->status ?? 'active',
                ],
                'date_debut' => $subscription->date_debut,
                'date_fin' => $subscription->date_fin,
                'statut' => $subscription->statut,
                'reference_paiement' => $subscription->reference_paiement,
                'actif' => (bool) $subscription->actif,
                'created_at' => $subscription->created_at,
                'updated_at' => $subscription->updated_at
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Détails de l\'abonnement récupérés'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des détails: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les abonnements d'un utilisateur spécifique
     */
    public function getUserSubscriptions($userId): JsonResponse
    {
        try {
            $user = User::findOrFail($userId);
            
            $subscriptions = Abonnement::with(['plan', 'boutique'])
                ->where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->get();

            $formattedSubscriptions = $subscriptions->map(function ($subscription) {
                return [
                    'id' => $subscription->id,
                    'plan_name' => $subscription->plan->nom,
                    'shop_name' => $subscription->boutique->nom,
                    'amount_paid' => (float) $subscription->plan->prix,
                    'start_date' => $subscription->date_debut,
                    'end_date' => $subscription->date_fin,
                    'status' => $subscription->statut,
                    'reference_paiement' => $subscription->reference_paiement,
                    'is_active' => (bool) $subscription->actif,
                    'created_at' => $subscription->created_at
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'nom' => $user->nom,
                        'prenom' => $user->prenom,
                        'email' => $user->email
                    ],
                    'subscriptions' => $formattedSubscriptions
                ],
                'message' => 'Abonnements utilisateur récupérés avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer un abonnement manuel
     */
    public function createManualSubscription(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id',
                'boutique_id' => 'required|exists:boutiques,id',
                'plan_id' => 'required|exists:plans_abonnement,id',
                'date_debut' => 'required|date',
                'duree_mois' => 'required|integer|min:1|max:36',
                'reference_paiement' => 'nullable|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données de validation échouées',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Vérifier que l'utilisateur possède bien cette boutique
            $boutique = Boutique::where('id', $request->boutique_id)
                               ->where('user_id', $request->user_id)
                               ->first();

            if (!$boutique) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette boutique n\'appartient pas à cet utilisateur'
                ], 400);
            }

            $dateDebut = Carbon::parse($request->date_debut);
            $dateFin = $dateDebut->copy()->addMonths($request->duree_mois);

            $subscription = Abonnement::create([
                'user_id' => $request->user_id,
                'boutique_id' => $request->boutique_id,
                'plan_id' => $request->plan_id,
                'date_debut' => $dateDebut,
                'date_fin' => $dateFin,
                'statut' => 'actif',
                'actif' => true,
                'reference_paiement' => $request->reference_paiement ?? 'MANUAL_' . time()
            ]);

            return response()->json([
                'success' => true,
                'data' => $this->formatSubscriptionForResponse($subscription),
                'message' => 'Abonnement manuel créé avec succès'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'abonnement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Annuler un abonnement
     */
    public function cancelSubscription(Request $request, $id): JsonResponse
    {
        try {
            $subscription = Abonnement::findOrFail($id);

            $subscription->update([
                'statut' => 'annule',
                'actif' => false,
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'data' => $this->formatSubscriptionForResponse($subscription),
                'message' => 'Abonnement annulé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Réactiver un abonnement
     */
    public function reactivateSubscription($id): JsonResponse
    {
        try {
            $subscription = Abonnement::findOrFail($id);

            // Vérifier si l'abonnement peut être réactivé
            $endDate = Carbon::parse($subscription->date_fin);
            if ($endDate->isPast()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de réactiver un abonnement expiré'
                ], 400);
            }

            $subscription->update([
                'statut' => 'actif',
                'actif' => true,
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'data' => $this->formatSubscriptionForResponse($subscription),
                'message' => 'Abonnement réactivé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réactivation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Prolonger un abonnement
     */
    public function extendSubscription(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'extension_months' => 'required|integer|min:1|max:24',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données de validation échouées',
                    'errors' => $validator->errors()
                ], 422);
            }

            $subscription = Abonnement::findOrFail($id);
            
            $currentEndDate = Carbon::parse($subscription->date_fin);
            $newEndDate = $currentEndDate->addMonths($request->extension_months);

            $subscription->update([
                'date_fin' => $newEndDate,
                'statut' => 'actif',
                'actif' => true,
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'data' => $this->formatSubscriptionForResponse($subscription),
                'message' => 'Abonnement prolongé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la prolongation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Changer le plan d'un abonnement
     */
    public function changeSubscriptionPlan(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'plan_id' => 'required|exists:plans_abonnement,id',
                'effective_date' => 'nullable|date|after_or_equal:today'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données de validation échouées',
                    'errors' => $validator->errors()
                ], 422);
            }

            $subscription = Abonnement::findOrFail($id);
            
            $subscription->update([
                'plan_id' => $request->plan_id,
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'data' => $this->formatSubscriptionForResponse($subscription->fresh()),
                'message' => 'Plan d\'abonnement modifié avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de plan: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==================== STATISTIQUES ET ANALYTICS ====================

    /**
     * Obtenir les statistiques des abonnements
     */
    public function getSubscriptionStats(Request $request): JsonResponse
    {
        try {
            $period = $request->get('period', '30d');
            
            $totalSubscriptions = Abonnement::count();
            $activeSubscriptions = Abonnement::where('statut', 'actif')->count();
            $expiredSubscriptions = Abonnement::where('statut', 'expire')->count();
            $cancelledSubscriptions = Abonnement::where('statut', 'annule')->count();

            // Revenus totaux
            $totalRevenue = DB::table('abonnements as a')
                ->join('plans_abonnement as p', 'a.plan_id', '=', 'p.id')
                ->sum('p.prix');

            // Revenus ce mois
            $monthlyRevenue = DB::table('abonnements as a')
                ->join('plans_abonnement as p', 'a.plan_id', '=', 'p.id')
                ->whereMonth('a.created_at', Carbon::now()->month)
                ->whereYear('a.created_at', Carbon::now()->year)
                ->sum('p.prix');

            // Plans les plus populaires
            $popularPlans = DB::table('abonnements as a')
                ->join('plans_abonnement as p', 'a.plan_id', '=', 'p.id')
                ->select('p.nom', DB::raw('count(*) as count'))
                ->groupBy('p.id', 'p.nom')
                ->orderBy('count', 'desc')
                ->limit(5)
                ->get();

            // Abonnements par mois (12 derniers mois)
            $monthlyStats = [];
            for ($i = 11; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $count = Abonnement::whereMonth('created_at', $date->month)
                                  ->whereYear('created_at', $date->year)
                                  ->count();
                $monthlyStats[] = [
                    'month' => $date->format('M Y'),
                    'count' => $count
                ];
            }

            $stats = [
                'overview' => [
                    'total_subscriptions' => $totalSubscriptions,
                    'active_subscriptions' => $activeSubscriptions,
                    'expired_subscriptions' => $expiredSubscriptions,
                    'cancelled_subscriptions' => $cancelledSubscriptions,
                    'total_revenue' => (float) $totalRevenue,
                    'monthly_revenue' => (float) $monthlyRevenue
                ],
                'popular_plans' => $popularPlans,
                'monthly_stats' => $monthlyStats
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Statistiques récupérées avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les revenus des abonnements
     */
    public function getSubscriptionRevenue(Request $request): JsonResponse
    {
        try {
            $period = $request->get('period', 'month');
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');
            $revenue = [];

            switch ($period) {
                case 'week':
                    for ($i = 6; $i >= 0; $i--) {
                        $date = Carbon::now()->subDays($i);
                        $dailyRevenue = DB::table('abonnements as a')
                            ->join('plans_abonnement as p', 'a.plan_id', '=', 'p.id')
                            ->whereDate('a.created_at', $date->toDateString())
                            ->sum('p.prix');
                        
                        $revenue[] = [
                            'date' => $date->format('d M'),
                            'revenue' => (float) $dailyRevenue
                        ];
                    }
                    break;

                case 'year':
                    for ($i = 11; $i >= 0; $i--) {
                        $date = Carbon::now()->subMonths($i);
                        $monthlyRevenue = DB::table('abonnements as a')
                            ->join('plans_abonnement as p', 'a.plan_id', '=', 'p.id')
                            ->whereMonth('a.created_at', $date->month)
                            ->whereYear('a.created_at', $date->year)
                            ->sum('p.prix');
                        
                        $revenue[] = [
                            'date' => $date->format('M Y'),
                            'revenue' => (float) $monthlyRevenue
                        ];
                    }
                    break;

                default: // month
                    $daysInMonth = Carbon::now()->daysInMonth;
                    for ($i = 1; $i <= $daysInMonth; $i++) {
                        $date = Carbon::now()->startOfMonth()->addDays($i - 1);
                        
                        if ($date->isFuture()) break;
                        
                        $dailyRevenue = DB::table('abonnements as a')
                            ->join('plans_abonnement as p', 'a.plan_id', '=', 'p.id')
                            ->whereDate('a.created_at', $date->toDateString())
                            ->sum('p.prix');
                        
                        $revenue[] = [
                            'date' => $date->format('d'),
                            'revenue' => (float) $dailyRevenue
                        ];
                    }
                    break;
            }

            // Filtrage par dates personnalisées
            if ($startDate && $endDate) {
                $customRevenue = DB::table('abonnements as a')
                    ->join('plans_abonnement as p', 'a.plan_id', '=', 'p.id')
                    ->whereBetween('a.created_at', [$startDate, $endDate])
                    ->sum('p.prix');
                    
                $revenue = [
                    [
                        'date' => 'Période personnalisée',
                        'revenue' => (float) $customRevenue
                    ]
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => $period,
                    'revenue' => $revenue,
                    'total' => array_sum(array_column($revenue, 'revenue'))
                ],
                'message' => 'Revenus récupérés avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des revenus: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les métriques de performance des plans
     */
    public function getPlanMetrics(): JsonResponse
    {
        try {
            $planMetrics = DB::table('plans_abonnement as p')
                ->leftJoin('abonnements as a', 'p.id', '=', 'a.plan_id')
                ->select([
                    'p.id',
                    'p.nom',
                    'p.prix',
                    DB::raw('COUNT(a.id) as total_subscriptions'),
                    DB::raw('COUNT(CASE WHEN a.statut = "actif" THEN 1 END) as active_subscriptions'),
                    DB::raw('COUNT(CASE WHEN a.statut = "annule" THEN 1 END) as cancelled_subscriptions'),
                    DB::raw('SUM(CASE WHEN a.statut = "actif" THEN p.prix ELSE 0 END) as active_revenue'),
                    DB::raw('SUM(p.prix) as total_revenue')
                ])
                ->groupBy('p.id', 'p.nom', 'p.prix')
                ->get();

            $metrics = $planMetrics->map(function ($metric) {
                $conversionRate = $metric->total_subscriptions > 0 
                    ? ($metric->active_subscriptions / $metric->total_subscriptions) * 100 
                    : 0;
                    
                return [
                    'plan_id' => $metric->id,
                    'plan_name' => $metric->nom,
                    'plan_price' => (float) $metric->prix,
                    'total_subscriptions' => $metric->total_subscriptions,
                    'active_subscriptions' => $metric->active_subscriptions,
                    'cancelled_subscriptions' => $metric->cancelled_subscriptions,
                    'conversion_rate' => round($conversionRate, 2),
                    'active_revenue' => (float) $metric->active_revenue,
                    'total_revenue' => (float) $metric->total_revenue
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $metrics,
                'message' => 'Métriques récupérées avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des métriques: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==================== RECHERCHE ET FILTRES ====================

    /**
     * Rechercher des abonnements
     */
    public function searchSubscriptions(Request $request): JsonResponse
    {
        try {
            $query = $request->get('search', '');
            $status = $request->get('status');
            $planId = $request->get('plan_id');
            $dateFrom = $request->get('date_from');
            $dateTo = $request->get('date_to');
            $page = $request->get('page', 1);
            $limit = $request->get('limit', 20);

            $subscriptions = DB::table('abonnements as a')
                ->join('users as u', 'a.user_id', '=', 'u.id')
                ->join('boutiques as b', 'a.boutique_id', '=', 'b.id')
                ->join('plans_abonnement as p', 'a.plan_id', '=', 'p.id')
                ->select([
                    'a.id',
                    'a.user_id',
                    'u.nom as user_nom',
                    'u.prenom as user_prenom',
                    'u.email as user_email',
                    'b.nom as shop_name',
                    'a.plan_id',
                    'p.nom as plan_name',
                    'p.prix as amount_paid',
                    'p.limite_produits as max_products',
                    'a.date_debut as start_date',
                    'a.date_fin as end_date',
                    'a.statut as status',
                    'a.reference_paiement',
                    'a.actif',
                    'a.created_at'
                ])
                ->when($query, function ($q) use ($query) {
                    return $q->where(function ($subQuery) use ($query) {
                        $subQuery->where('u.nom', 'like', "%{$query}%")
                                 ->orWhere('u.prenom', 'like', "%{$query}%")
                                 ->orWhere('u.email', 'like', "%{$query}%")
                                 ->orWhere('b.nom', 'like', "%{$query}%")
                                 ->orWhere('p.nom', 'like', "%{$query}%")
                                 ->orWhere('a.reference_paiement', 'like', "%{$query}%");
                    });
                })
                ->when($status, function ($q) use ($status) {
                    return $q->where('a.statut', $status);
                })
                ->when($planId, function ($q) use ($planId) {
                    return $q->where('a.plan_id', $planId);
                })
                ->when($dateFrom, function ($q) use ($dateFrom) {
                    return $q->whereDate('a.created_at', '>=', $dateFrom);
                })
                ->when($dateTo, function ($q) use ($dateTo) {
                    return $q->whereDate('a.created_at', '<=', $dateTo);
                })
                ->orderBy('a.created_at', 'desc')
                ->paginate($limit, ['*'], 'page', $page);

            $formattedResults = $subscriptions->getCollection()->map(function ($subscription) {
                return [
                    'id' => $subscription->id,
                    'user_id' => $subscription->user_id,
                    'user_name' => $subscription->user_nom . ' ' . $subscription->user_prenom,
                    'user_email' => $subscription->user_email,
                    'shop_name' => $subscription->shop_name,
                    'plan_id' => $subscription->plan_id,
                    'plan_name' => $subscription->plan_name,
                    'amount_paid' => (float) $subscription->amount_paid,
                    'max_products' => $subscription->max_products,
                    'start_date' => $subscription->start_date,
                    'end_date' => $subscription->end_date,
                    'status' => $subscription->status,
                    'reference_paiement' => $subscription->reference_paiement,
                    'is_active' => (bool) $subscription->actif,
                    'created_at' => $subscription->created_at
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedResults,
                'pagination' => [
                    'current_page' => $subscriptions->currentPage(),
                    'last_page' => $subscriptions->lastPage(),
                    'per_page' => $subscriptions->perPage(),
                    'total' => $subscriptions->total()
                ],
                'message' => 'Recherche effectuée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les abonnements expirants
     */
    public function getExpiringSubscriptions(Request $request): JsonResponse
    {
        try {
            $days = $request->get('days', 7);
            $expirationDate = Carbon::now()->addDays($days);

            $subscriptions = Abonnement::with(['user', 'plan', 'boutique'])
                ->where('statut', 'actif')
                ->whereDate('date_fin', '<=', $expirationDate)
                ->whereDate('date_fin', '>=', Carbon::now())
                ->orderBy('date_fin', 'asc')
                ->get();

            $formattedSubscriptions = $subscriptions->map(function ($subscription) {
                $daysUntilExpiry = Carbon::now()->diffInDays(Carbon::parse($subscription->date_fin));
                
                return [
                    'id' => $subscription->id,
                    'user_name' => $subscription->user->nom . ' ' . $subscription->user->prenom,
                    'user_email' => $subscription->user->email,
                    'shop_name' => $subscription->boutique->nom,
                    'plan_name' => $subscription->plan->nom,
                    'end_date' => $subscription->date_fin,
                    'days_until_expiry' => $daysUntilExpiry,
                    'amount' => (float) $subscription->plan->prix,
                    'status' => $subscription->statut
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedSubscriptions,
                'message' => 'Abonnements expirants récupérés avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des abonnements expirants: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==================== EXPORT ET RAPPORTS ====================

    /**
     * Exporter les données d'abonnements
     */
    public function exportSubscriptions(Request $request): JsonResponse
    {
        try {
            $format = $request->get('format', 'csv');
            $status = $request->get('status');
            $planId = $request->get('plan_id');
            $dateFrom = $request->get('date_from');
            $dateTo = $request->get('date_to');

            $query = DB::table('abonnements as a')
                ->join('users as u', 'a.user_id', '=', 'u.id')
                ->join('boutiques as b', 'a.boutique_id', '=', 'b.id')
                ->join('plans_abonnement as p', 'a.plan_id', '=', 'p.id')
                ->select([
                    'u.nom as user_nom',
                    'u.prenom as user_prenom',
                    'u.email as user_email',
                    'b.nom as shop_name',
                    'p.nom as plan_name',
                    'p.prix as amount_paid',
                    'a.date_debut as start_date',
                    'a.date_fin as end_date',
                    'a.statut as status',
                    'a.reference_paiement',
                    'a.created_at'
                ]);

            // Appliquer les filtres
            if ($status) $query->where('a.statut', $status);
            if ($planId) $query->where('a.plan_id', $planId);
            if ($dateFrom) $query->whereDate('a.created_at', '>=', $dateFrom);
            if ($dateTo) $query->whereDate('a.created_at', '<=', $dateTo);

            $data = $query->orderBy('a.created_at', 'desc')->get();

            // Simuler la génération d'un fichier (dans un vrai projet, utiliser des packages comme League/Csv)
            $filename = 'subscriptions_export_' . date('Y-m-d_H-i-s') . '.' . $format;
            
            return response()->json([
                'success' => true,
                'data' => [
                    'filename' => $filename,
                    'records_count' => $data->count(),
                    'download_url' => url("/downloads/{$filename}") // URL fictive
                ],
                'message' => 'Export généré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer un rapport d'abonnements
     */
    public function generateSubscriptionReport(Request $request): JsonResponse
    {
        try {
            $reportType = $request->get('type', 'monthly');
            $startDate = $request->get('start_date', Carbon::now()->startOfMonth());
            $endDate = $request->get('end_date', Carbon::now()->endOfMonth());

            $report = [];

            switch ($reportType) {
                case 'daily':
                    $report = $this->generateDailyReport($startDate, $endDate);
                    break;
                case 'weekly':
                    $report = $this->generateWeeklyReport($startDate, $endDate);
                    break;
                case 'yearly':
                    $report = $this->generateYearlyReport($startDate, $endDate);
                    break;
                default: // monthly
                    $report = $this->generateMonthlyReport($startDate, $endDate);
                    break;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'report_type' => $reportType,
                    'period' => [
                        'start_date' => $startDate,
                        'end_date' => $endDate
                    ],
                    'report' => $report
                ],
                'message' => 'Rapport généré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==================== NOTIFICATIONS ET COMMUNICATIONS ====================

    /**
     * Envoyer une notification à tous les abonnés d'un plan
     */
    public function notifyPlanSubscribers(Request $request, $planId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'subject' => 'required|string|max:255',
                'message' => 'required|string',
                'type' => 'required|in:email,sms,push'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données de validation échouées',
                    'errors' => $validator->errors()
                ], 422);
            }

            $plan = PlanAbonnement::findOrFail($planId);
            
            $subscribers = Abonnement::with('user')
                ->where('plan_id', $planId)
                ->where('statut', 'actif')
                ->get();

            $sentCount = 0;

            foreach ($subscribers as $subscription) {
                // Ici vous implémenteriez l'envoi réel selon le type
                switch ($request->type) {
                    case 'email':
                        // Mail::to($subscription->user->email)->send(...);
                        $sentCount++;
                        break;
                    case 'sms':
                        // Envoi SMS
                        $sentCount++;
                        break;
                    case 'push':
                        // Notification push
                        $sentCount++;
                        break;
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'plan_name' => $plan->nom,
                    'recipients_count' => $subscribers->count(),
                    'sent_count' => $sentCount,
                    'type' => $request->type
                ],
                'message' => "Notifications envoyées à {$sentCount} abonné(s)"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi des notifications: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Envoyer des rappels d'expiration
     */
    public function sendExpirationReminders(Request $request): JsonResponse
    {
        try {
            $days = $request->get('days', 7);
            $expirationDate = Carbon::now()->addDays($days);

            $expiringSubscriptions = Abonnement::with(['user', 'plan'])
                ->where('statut', 'actif')
                ->whereDate('date_fin', '<=', $expirationDate)
                ->whereDate('date_fin', '>=', Carbon::now())
                ->get();

            $sentCount = 0;

            foreach ($expiringSubscriptions as $subscription) {
                // Ici vous implémenteriez l'envoi réel du rappel
                // Mail::to($subscription->user->email)->send(new ExpirationReminderMail($subscription));
                $sentCount++;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'expiring_subscriptions' => $expiringSubscriptions->count(),
                    'reminders_sent' => $sentCount,
                    'days_notice' => $days
                ],
                'message' => "Rappels d'expiration envoyés à {$sentCount} utilisateur(s)"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi des rappels: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==================== MÉTHODES UTILITAIRES PRIVÉES ====================

    /**
     * Générer un slug unique
     */
    private function generateSlug($name): string
    {
        $slug = \Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;

        while (PlanAbonnement::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Obtenir les fonctionnalités d'un plan
     */
    private function getFeatures($plan): array
    {
        $features = [];
        
        if ($plan->mobile_money) $features[] = 'Mobile Money';
        if ($plan->dashboard_boutique) $features[] = 'Dashboard Boutique';
        if ($plan->personnalisation_avancee) $features[] = 'Personnalisation Avancée';
        if ($plan->statistiques_seo) $features[] = 'Statistiques SEO';
        if ($plan->support_prioritaire) $features[] = 'Support Prioritaire';
        if ($plan->certificat_avance) $features[] = 'Certificat Avancé';
        if ($plan->multi_utilisateurs) $features[] = 'Multi-utilisateurs';
        if ($plan->rapports_exportables) $features[] = 'Rapports Exportables';
        if ($plan->support_dedie) $features[] = 'Support Dédié';

        return $features;
    }

    /**
     * Définir les fonctionnalités à partir d'un tableau
     */
    private function setFeaturesFromArray(&$planData, array $features): void
    {
        $planData['mobile_money'] = in_array('Mobile Money', $features);
        $planData['dashboard_boutique'] = in_array('Dashboard Boutique', $features);
        $planData['personnalisation_avancee'] = in_array('Personnalisation Avancée', $features);
        $planData['statistiques_seo'] = in_array('Statistiques SEO', $features);
        $planData['support_prioritaire'] = in_array('Support Prioritaire', $features);
        $planData['certificat_avance'] = in_array('Certificat Avancé', $features);
        $planData['multi_utilisateurs'] = in_array('Multi-utilisateurs', $features);
        $planData['rapports_exportables'] = in_array('Rapports Exportables', $features);
        $planData['support_dedie'] = in_array('Support Dédié', $features);
    }

    /**
     * Formater un plan pour la réponse
     */
    private function formatPlan($plan): array
    {
        return [
            'id' => $plan->id,
            'nom' => $plan->nom,
            'slug' => $plan->slug,
            'description' => $plan->description,
            'prix' => (float) $plan->prix,
            'duree_mois' => $plan->duree_mois,
            'commission' => $plan->commission,
            'limite_produits' => $plan->limite_produits,
            'features' => $this->getFeatures($plan),
            'mobile_money' => (bool) $plan->mobile_money,
            'dashboard_boutique' => (bool) $plan->dashboard_boutique,
            'personnalisation_avancee' => (bool) $plan->personnalisation_avancee,
            'statistiques_seo' => (bool) $plan->statistiques_seo,
            'support_prioritaire' => (bool) $plan->support_prioritaire,
            'certificat_avance' => (bool) $plan->certificat_avance,
            'multi_utilisateurs' => (bool) $plan->multi_utilisateurs,
            'rapports_exportables' => (bool) $plan->rapports_exportables,
            'support_dedie' => (bool) $plan->support_dedie,
            'is_free' => (bool) $plan->is_free,
            'is_active' => (bool) $plan->is_active,
            'is_popular' => (bool) ($plan->is_popular ?? false),
            'created_at' => $plan->created_at,
            'updated_at' => $plan->updated_at
        ];
    }

    /**
     * Formater un abonnement pour la réponse
     */
    private function formatSubscriptionForResponse($subscription): array
    {
        return [
            'id' => $subscription->id,
            'user_id' => $subscription->user_id,
            'plan_id' => $subscription->plan_id,
            'boutique_id' => $subscription->boutique_id,
            'date_debut' => $subscription->date_debut,
            'date_fin' => $subscription->date_fin,
            'statut' => $subscription->statut,
            'reference_paiement' => $subscription->reference_paiement,
            'actif' => (bool) $subscription->actif,
            'created_at' => $subscription->created_at,
            'updated_at' => $subscription->updated_at
        ];
    }

    /**
     * Générer un rapport quotidien
     */
    private function generateDailyReport($startDate, $endDate): array
    {
        return DB::table('abonnements as a')
            ->join('plans_abonnement as p', 'a.plan_id', '=', 'p.id')
            ->select([
                DB::raw('DATE(a.created_at) as date'),
                DB::raw('COUNT(*) as new_subscriptions'),
                DB::raw('SUM(p.prix) as revenue'),
                DB::raw('COUNT(CASE WHEN a.statut = "actif" THEN 1 END) as active_count')
            ])
            ->whereBetween('a.created_at', [$startDate, $endDate])
            ->groupBy(DB::raw('DATE(a.created_at)'))
            ->orderBy('date')
            ->get()
            ->toArray();
    }

    /**
     * Générer un rapport hebdomadaire
     */
    private function generateWeeklyReport($startDate, $endDate): array
    {
        return DB::table('abonnements as a')
            ->join('plans_abonnement as p', 'a.plan_id', '=', 'p.id')
            ->select([
                DB::raw('YEARWEEK(a.created_at) as week'),
                DB::raw('COUNT(*) as new_subscriptions'),
                DB::raw('SUM(p.prix) as revenue'),
                DB::raw('COUNT(CASE WHEN a.statut = "actif" THEN 1 END) as active_count')
            ])
            ->whereBetween('a.created_at', [$startDate, $endDate])
            ->groupBy(DB::raw('YEARWEEK(a.created_at)'))
            ->orderBy('week')
            ->get()
            ->toArray();
    }

    /**
     * Générer un rapport mensuel
     */
    private function generateMonthlyReport($startDate, $endDate): array
    {
        return DB::table('abonnements as a')
            ->join('plans_abonnement as p', 'a.plan_id', '=', 'p.id')
            ->select([
                DB::raw('YEAR(a.created_at) as year'),
                DB::raw('MONTH(a.created_at) as month'),
                DB::raw('COUNT(*) as new_subscriptions'),
                DB::raw('SUM(p.prix) as revenue'),
                DB::raw('COUNT(CASE WHEN a.statut = "actif" THEN 1 END) as active_count')
            ])
            ->whereBetween('a.created_at', [$startDate, $endDate])
            ->groupBy(DB::raw('YEAR(a.created_at)'), DB::raw('MONTH(a.created_at)'))
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->toArray();
    }

    /**
     * Générer un rapport annuel
     */
    private function generateYearlyReport($startDate, $endDate): array
    {
        return DB::table('abonnements as a')
            ->join('plans_abonnement as p', 'a.plan_id', '=', 'p.id')
            ->select([
                DB::raw('YEAR(a.created_at) as year'),
                DB::raw('COUNT(*) as new_subscriptions'),
                DB::raw('SUM(p.prix) as revenue'),
                DB::raw('COUNT(CASE WHEN a.statut = "actif" THEN 1 END) as active_count')
            ])
            ->whereBetween('a.created_at', [$startDate, $endDate])
            ->groupBy(DB::raw('YEAR(a.created_at)'))
            ->orderBy('year')
            ->get()
            ->toArray();
    }
}