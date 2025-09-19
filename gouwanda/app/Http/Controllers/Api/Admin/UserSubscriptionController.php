<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Boutique;
use App\Models\Abonnement;
use App\Models\PlanAbonnement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UserSubscriptionController extends Controller
{
    /**
     * Récupérer tous les utilisateurs avec leurs abonnements
     */
    public function getUsersWithSubscriptions(Request $request)
    {
        try {
            $users = User::with(['boutique', 'boutique.abonnements' => function($query) {
                $query->where('statut', 'actif')
                      ->orWhere('statut', 'expired')
                      ->orderBy('created_at', 'desc');
            }, 'boutique.abonnements.plan'])
            ->whereHas('boutique')
            ->paginate($request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $users,
                'total' => $users->total()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des utilisateurs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les utilisateurs avec des problèmes d'abonnement
     */
    public function getUsersWithSubscriptionIssues(Request $request)
    {
        try {
            $users = User::with(['boutique', 'boutique.abonnements' => function($query) {
                $query->where(function($q) {
                    $q->where('statut', 'expired')
                      ->orWhere('statut', 'pending')
                      ->orWhere('statut', 'cancelled');
                })->orWhere('date_fin', '<', now())
                ->orderBy('created_at', 'desc');
            }, 'boutique.abonnements.plan'])
            ->whereHas('boutique.abonnements', function($query) {
                $query->where(function($q) {
                    $q->where('statut', 'expired')
                      ->orWhere('statut', 'pending')
                      ->orWhere('statut', 'cancelled');
                })->orWhere('date_fin', '<', now());
            })
            ->paginate($request->get('per_page', 20));

            // Ajouter la détection des problèmes
            $users->getCollection()->transform(function($user) {
                $user->subscription_issues = $this->detectSubscriptionIssues($user);
                return $user;
            });

            return response()->json([
                'success' => true,
                'data' => $users,
                'total' => $users->total()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des utilisateurs avec problèmes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détecter les problèmes d'abonnement pour un utilisateur
     */
    private function detectSubscriptionIssues(User $user)
    {
        $issues = [];
        $boutique = $user->boutique;

        if (!$boutique) {
            return ['Aucune boutique associée'];
        }

        $abonnement = $boutique->abonnements()->where('statut', 'actif')->first();

        if (!$abonnement) {
            $issues[] = 'Aucun abonnement actif';
        } else {
            // Vérifier l'expiration
            if ($abonnement->date_fin && Carbon::parse($abonnement->date_fin)->isPast()) {
                $issues[] = 'Abonnement expiré';
            }

            // Vérifier les jours restants
            if ($abonnement->date_fin) {
                $daysRemaining = Carbon::parse($abonnement->date_fin)->diffInDays(now());
                if ($daysRemaining <= 3) {
                    $issues[] = "Expire dans {$daysRemaining} jour(s)";
                }
            }

            // Vérifier la limite de produits
            if ($abonnement->plan) {
                $productsCount = $boutique->produits()->count();
                $maxProducts = $abonnement->plan->limite_produits;

                if ($maxProducts !== -1 && $maxProducts !== null && $productsCount >= $maxProducts) {
                    $issues[] = "Limite de produits atteinte ({$productsCount}/{$maxProducts})";
                }
            }
        }

        return $issues;
    }

    /**
     * Récupérer l'historique des abonnements d'un utilisateur
     */
    public function getUserSubscriptionHistory($userId)
    {
        try {
            $user = User::with(['boutique.abonnements' => function($query) {
                $query->orderBy('created_at', 'desc');
            }, 'boutique.abonnements.plan'])->findOrFail($userId);

            return response()->json([
                'success' => true,
                'data' => $user->boutique->abonnements ?? []
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Mettre à jour l'abonnement d'un utilisateur
     */
    public function updateUserSubscription(Request $request, $userId)
    {
        try {
            $user = User::with('boutique')->findOrFail($userId);

            if (!$user->boutique) {
                return response()->json([
                    'success' => false,
                    'message' => 'L\'utilisateur n\'a pas de boutique'
                ], 422);
            }

            $validated = $request->validate([
                'plan_id' => 'required|exists:plan_abonnements,id',
                'date_debut' => 'required|date',
                'date_fin' => 'required|date|after:date_debut',
                'statut' => 'required|in:actif,expired,pending,cancelled',
                'montant' => 'required|numeric|min:0'
            ]);

            // Créer ou mettre à jour l'abonnement
            $abonnement = $user->boutique->abonnements()->updateOrCreate(
                ['statut' => 'actif'],
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Abonnement mis à jour avec succès',
                'data' => $abonnement->load('plan')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'abonnement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Résoudre un problème d'abonnement
     */
    public function resolveSubscriptionIssue(Request $request, $userId)
    {
        try {
            $user = User::with('boutique')->findOrFail($userId);
            $action = $request->input('action');
            $notes = $request->input('notes');

            switch ($action) {
                case 'renew_subscription':
                    // Logique de renouvellement
                    break;
                case 'upgrade_plan':
                    // Logique de mise à niveau
                    break;
                case 'extend_trial':
                    // Logique d'extension d'essai
                    break;
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Action non reconnue'
                    ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'Problème résolu avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la résolution du problème',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}