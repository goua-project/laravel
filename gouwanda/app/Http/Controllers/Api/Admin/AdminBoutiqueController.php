<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Boutique;
use App\Models\User;
use App\Models\Abonnement;
use App\Models\PlanAbonnement;
use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class AdminBoutiqueController extends Controller
{
    /**
     * Display a listing of the boutiques.
     */
    public function index(Request $request)
    {
        try {
            $query = Boutique::with(['user', 'abonnements.plan'])
                ->withCount(['produits as total_produits' => function($q) {
                    $q->where('is_published', 1);
                }])
                ->withCount(['produits as produits_actifs' => function($q) {
                    $q->where('visible', 1)->where('is_published', 1);
                }]);

            // Filtrage par statut
            if ($request->has('status') && in_array($request->status, ['active', 'inactive'])) {
                $query->where('status', $request->status);
            }

            // Filtrage par catégorie
            if ($request->has('categorie') && $request->categorie !== 'all') {
                $query->where('categorie', $request->categorie);
            }

            // Recherche
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('categorie', 'like', "%{$search}%")
                      ->orWhereHas('user', function($q) use ($search) {
                          $q->where('prenom', 'like', "%{$search}%")
                            ->orWhere('nom', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            // Tri
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $boutiques = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'boutiques' => $boutiques,
                'total' => $boutiques->total(),
                'categories' => Boutique::distinct()->pluck('categorie')->filter()
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des boutiques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified boutique.
     */
    public function show($id)
    {
        try {
            $boutique = Boutique::with([
                'user', 
                'abonnements.plan',
                'produits' => function($q) {
                    $q->orderBy('created_at', 'desc');
                }
            ])
            ->withCount(['produits as total_produits'])
            ->withCount(['produits as produits_actifs' => function($q) {
                $q->where('visible', 1)->where('is_published', 1);
            }])
            ->findOrFail($id);

            // Statistiques supplémentaires
            $stats = [
                'produits_par_categorie' => Produit::where('boutique_id', $id)
                    ->where('is_published', 1)
                    ->groupBy('categorie')
                    ->select('categorie', DB::raw('count(*) as total'))
                    ->get(),
                
                'chiffre_affaires' => DB::table('commandes')
                    ->where('boutique_id', $id)
                    ->where('statut', 'livree')
                    ->sum('montant_total'),
                
                'commandes_total' => DB::table('commandes')
                    ->where('boutique_id', $id)
                    ->count(),
                
                'commandes_livrees' => DB::table('commandes')
                    ->where('boutique_id', $id)
                    ->where('statut', 'livree')
                    ->count()
            ];

            return response()->json([
                'success' => true,
                'boutique' => $boutique,
                'statistiques' => $stats
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Boutique non trouvée: ' . $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified boutique.
     */
    public function update(Request $request, $id)
    {
        try {
            $boutique = Boutique::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'nom' => 'sometimes|required|string|max:255',
                'slogan' => 'nullable|string|max:255',
                'description' => 'sometimes|required|string',
                'categorie' => 'sometimes|required|string|max:255',
                'type' => 'sometimes|required|in:physical,digital,service',
                'couleur_accent' => 'sometimes|required|string|max:7',
                'mots_cles' => 'nullable|string',
                'is_active' => 'sometimes|boolean',
                'status' => 'sometimes|in:active,inactive'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $boutique->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Boutique mise à jour avec succès',
                'boutique' => $boutique->fresh(['user', 'abonnements.plan'])
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle boutique status.
     */
    public function toggleStatus($id)
    {
        try {
            $boutique = Boutique::findOrFail($id);
            
            $boutique->update([
                'is_active' => !$boutique->is_active,
                'status' => $boutique->is_active ? 'inactive' : 'active'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Statut de la boutique modifié avec succès',
                'boutique' => $boutique
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de statut: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update boutique logo.
     */
    public function updateLogo(Request $request, $id)
    {
        try {
            $boutique = Boutique::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Supprimer l'ancien logo s'il existe
            if ($boutique->logo && Storage::exists($boutique->logo)) {
                Storage::delete($boutique->logo);
            }

            // Stocker le nouveau logo
            $logoPath = $request->file('logo')->store('boutiques/logos', 'public');

            $boutique->update(['logo' => $logoPath]);

            return response()->json([
                'success' => true,
                'message' => 'Logo mis à jour avec succès',
                'logo_url' => Storage::url($logoPath)
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du logo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get boutique statistics.
     */
    public function getStatistics($id)
    {
        try {
            $boutique = Boutique::findOrFail($id);

            $stats = [
                'total_produits' => Produit::where('boutique_id', $id)->count(),
                'produits_actifs' => Produit::where('boutique_id', $id)
                    ->where('visible', 1)
                    ->where('is_published', 1)
                    ->count(),
                
                'chiffre_affaires_total' => DB::table('commandes')
                    ->where('boutique_id', $id)
                    ->where('statut', 'livree')
                    ->sum('montant_total'),
                
                'commandes_total' => DB::table('commandes')
                    ->where('boutique_id', $id)
                    ->count(),
                
                'taux_conversion' => 0, // À implémenter avec la logique de conversion
                
                'produits_par_categorie' => Produit::where('boutique_id', $id)
                    ->where('is_published', 1)
                    ->groupBy('categorie')
                    ->select('categorie', DB::raw('count(*) as total'))
                    ->get(),
                
                'evolution_ventes' => DB::table('commandes')
                    ->where('boutique_id', $id)
                    ->where('statut', 'livree')
                    ->where('created_at', '>=', now()->subMonths(6))
                    ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(montant_total) as total'))
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get()
            ];

            return response()->json([
                'success' => true,
                'statistiques' => $stats
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get boutique subscriptions.
     */
    public function getSubscriptions($id)
    {
        try {
            $abonnements = Abonnement::with('plan')
                ->where('boutique_id', $id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'abonnements' => $abonnements
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des abonnements: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update boutique subscription.
     */
    public function updateSubscription(Request $request, $boutiqueId, $abonnementId)
    {
        try {
            $abonnement = Abonnement::where('boutique_id', $boutiqueId)
                ->findOrFail($abonnementId);

            $validator = Validator::make($request->all(), [
                'plan_id' => 'sometimes|required|exists:plans_abonnement,id',
                'date_debut' => 'sometimes|required|date',
                'date_fin' => 'sometimes|required|date|after:date_debut',
                'statut' => 'sometimes|required|in:actif,expire,annule',
                'actif' => 'sometimes|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $abonnement->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Abonnement mis à jour avec succès',
                'abonnement' => $abonnement->fresh('plan')
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'abonnement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new subscription for boutique.
     */
    public function createSubscription(Request $request, $id)
    {
        try {
            $boutique = Boutique::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'plan_id' => 'required|exists:plans_abonnement,id',
                'date_debut' => 'required|date',
                'date_fin' => 'required|date|after:date_debut',
                'statut' => 'required|in:actif,expire,annule'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Désactiver les autres abonnements
            Abonnement::where('boutique_id', $id)
                ->where('actif', true)
                ->update(['actif' => false]);

            $abonnement = Abonnement::create([
                'boutique_id' => $id,
                'user_id' => $boutique->user_id,
                'plan_id' => $request->plan_id,
                'date_debut' => $request->date_debut,
                'date_fin' => $request->date_fin,
                'statut' => $request->statut,
                'actif' => true,
                'reference_paiement' => 'ADMIN-' . time()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Abonnement créé avec succès',
                'abonnement' => $abonnement->load('plan')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'abonnement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete the specified boutique.
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $boutique = Boutique::findOrFail($id);

            // Supprimer les abonnements
            Abonnement::where('boutique_id', $id)->delete();

            // Supprimer les produits
            Produit::where('boutique_id', $id)->delete();

            // Supprimer le logo s'il existe
            if ($boutique->logo && Storage::exists($boutique->logo)) {
                Storage::delete($boutique->logo);
            }

            $boutique->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Boutique supprimée avec succès'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Force delete boutique (with all relations).
     */
    public function forceDestroy($id)
    {
        try {
            DB::beginTransaction();

            $boutique = Boutique::withTrashed()->findOrFail($id);

            // Supprimer toutes les relations
            Abonnement::where('boutique_id', $id)->forceDelete();
            Produit::where('boutique_id', $id)->forceDelete();

            // Supprimer le logo
            if ($boutique->logo && Storage::exists($boutique->logo)) {
                Storage::delete($boutique->logo);
            }

            $boutique->forceDelete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Boutique supprimée définitivement avec succès'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression définitive: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get boutique products.
     */
    public function getProducts($id, Request $request)
    {
        try {
            $query = Produit::where('boutique_id', $id)
                ->with(['boutique'])
                ->orderBy('created_at', 'desc');

            // Filtrage par statut
            if ($request->has('status')) {
                if ($request->status === 'active') {
                    $query->where('visible', 1)->where('is_published', 1);
                } elseif ($request->status === 'inactive') {
                    $query->where('visible', 0)->orWhere('is_published', 0);
                }
            }

            // Filtrage par catégorie
            if ($request->has('categorie') && $request->categorie !== 'all') {
                $query->where('categorie', $request->categorie);
            }

            $produits = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'produits' => $produits,
                'total' => $produits->total()
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des produits: ' . $e->getMessage()
            ], 500);
        }
    }
}