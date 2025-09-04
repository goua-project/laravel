<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Boutique;
use App\Models\Abonnement;
use App\Models\PlansAbonnement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminUserController extends Controller
{
    /**
     * Récupérer tous les utilisateurs avec leurs informations complètes
     */
    public function index()
    {
        try {
            // Récupérer tous les utilisateurs avec leurs relations
            $users = User::with(['boutiques.abonnements.plan'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($user) {
                    $boutique = $user->boutiques->first();
                    $abonnement = $boutique ? $boutique->abonnements->first() : null;
                    $plan = $abonnement ? $abonnement->plan : null;

                    return [
                        'id' => $user->id,
                        'nom' => $user->nom,
                        'prenom' => $user->prenom,
                        'telephone' => $user->telephone,
                        'localite' => $user->localite,
                        'pays' => $user->pays,
                        'email' => $user->email,
                        'role' => $user->role,
                        'is_active' => (bool)$user->is_active,
                        'email_verified_at' => $user->email_verified_at,
                        'created_at' => $user->created_at,
                        'updated_at' => $user->updated_at,
                        'boutique' => $boutique ? [
                            'id' => $boutique->id,
                            'nom' => $boutique->nom,
                            'slug' => $boutique->slug,
                            'categorie' => $boutique->categorie,
                            'status' => $boutique->status,
                            'is_active' => (bool)$boutique->is_active,
                        ] : null,
                        'abonnement' => $abonnement ? [
                            'id' => $abonnement->id,
                            'date_debut' => $abonnement->date_debut,
                            'date_fin' => $abonnement->date_fin,
                            'statut' => $abonnement->statut,
                            'actif' => (bool)$abonnement->actif,
                        ] : null,
                        'plan' => $plan ? [
                            'id' => $plan->id,
                            'nom' => $plan->nom,
                            'slug' => $plan->slug,
                            'prix' => $plan->prix,
                            'duree_mois' => $plan->duree_mois,
                            'commission' => $plan->commission,
                            'limite_produits' => $plan->limite_produits,
                        ] : null,
                    ];
                });

            return response()->json([
                'success' => true,
                'users' => $users,
                'total' => $users->count()
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Erreur lors de la récupération des utilisateurs: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des utilisateurs',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }



    public function store(Request $request)
{
    try {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'telephone' => 'required|string|max:20|unique:users',
            'localite' => 'required|string|max:255',
            'pays' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,vendeur,client',
            'is_active' => 'sometimes|boolean',
        ], [
            'telephone.unique' => 'Ce numéro de téléphone est déjà utilisé',
            'email.unique' => 'Cette adresse email est déjà utilisée',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères',
            'role.in' => 'Le rôle doit être admin, vendeur ou client',
        ]);

        // Hasher le mot de passe
        $validated['password'] = Hash::make($validated['password']);
        
        // Définir is_active par défaut à true si non fourni
        $validated['is_active'] = $validated['is_active'] ?? true;

        // Créer l'utilisateur
        $user = User::create($validated);

        // Charger les relations pour la réponse
        $user->load(['boutiques.abonnements.plan']);
        
        $boutique = $user->boutiques->first();
        $abonnement = $boutique ? $boutique->abonnements->first() : null;
        $plan = $abonnement ? $abonnement->plan : null;

        $userData = [
            'id' => $user->id,
            'nom' => $user->nom,
            'prenom' => $user->prenom,
            'telephone' => $user->telephone,
            'localite' => $user->localite,
            'pays' => $user->pays,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => (bool)$user->is_active,
            'email_verified_at' => $user->email_verified_at,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
            'boutique' => $boutique ? [
                'id' => $boutique->id,
                'nom' => $boutique->nom,
                'slug' => $boutique->slug,
                'categorie' => $boutique->categorie,
                'status' => $boutique->status,
                'is_active' => (bool)$boutique->is_active,
            ] : null,
            'abonnement' => $abonnement ? [
                'id' => $abonnement->id,
                'date_debut' => $abonnement->date_debut,
                'date_fin' => $abonnement->date_fin,
                'statut' => $abonnement->statut,
                'actif' => (bool)$abonnement->actif,
            ] : null,
            'plan' => $plan ? [
                'id' => $plan->id,
                'nom' => $plan->nom,
                'slug' => $plan->slug,
                'prix' => $plan->prix,
                'duree_mois' => $plan->duree_mois,
                'commission' => $plan->commission,
                'limite_produits' => $plan->limite_produits,
            ] : null,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur créé avec succès',
            'user' => $userData
        ], 201);

    } catch (ValidationException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur de validation',
            'errors' => $e->errors()
        ], 422);
    } catch (\Exception $e) {
        \Log::error('Erreur lors de la création de l\'utilisateur: ' . $e->getMessage());
        
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la création de l\'utilisateur',
            'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
        ], 500);
    }
}

    /**
     * Récupérer un utilisateur spécifique
     */
    public function show($id)
    {
        try {
            $user = User::with(['boutiques.abonnements.plan'])
                ->findOrFail($id);

            $boutique = $user->boutiques->first();
            $abonnement = $boutique ? $boutique->abonnements->first() : null;
            $plan = $abonnement ? $abonnement->plan : null;

            $userData = [
                'id' => $user->id,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'telephone' => $user->telephone,
                'localite' => $user->localite,
                'pays' => $user->pays,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => (bool)$user->is_active,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'boutique' => $boutique ? [
                    'id' => $boutique->id,
                    'nom' => $boutique->nom,
                    'slug' => $boutique->slug,
                    'categorie' => $boutique->categorie,
                    'status' => $boutique->status,
                    'is_active' => (bool)$boutique->is_active,
                ] : null,
                'abonnement' => $abonnement ? [
                    'id' => $abonnement->id,
                    'date_debut' => $abonnement->date_debut,
                    'date_fin' => $abonnement->date_fin,
                    'statut' => $abonnement->statut,
                    'actif' => (bool)$abonnement->actif,
                ] : null,
                'plan' => $plan ? [
                    'id' => $plan->id,
                    'nom' => $plan->nom,
                    'slug' => $plan->slug,
                    'prix' => $plan->prix,
                    'duree_mois' => $plan->duree_mois,
                    'commission' => $plan->commission,
                    'limite_produits' => $plan->limite_produits,
                ] : null,
            ];

            return response()->json([
                'success' => true,
                'user' => $userData
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Erreur lors de la récupération de l\'utilisateur: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 404);
        }
    }

    /**
     * Mettre à jour un utilisateur
     */
    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            $validated = $request->validate([
                'nom' => 'sometimes|required|string|max:255',
                'prenom' => 'sometimes|required|string|max:255',
                'telephone' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:20',
                    Rule::unique('users')->ignore($user->id)
                ],
                'localite' => 'sometimes|required|string|max:255',
                'pays' => 'sometimes|required|string|max:255',
                'email' => [
                    'sometimes',
                    'required',
                    'string',
                    'email',
                    'max:255',
                    Rule::unique('users')->ignore($user->id)
                ],
                'role' => 'sometimes|required|in:admin,vendeur,client',
                'is_active' => 'sometimes|required|boolean',
            ], [
                'telephone.unique' => 'Ce numéro de téléphone est déjà utilisé',
                'email.unique' => 'Cette adresse email est déjà utilisée',
                'role.in' => 'Le rôle doit être admin, vendeur ou client',
            ]);

            // Mettre à jour l'utilisateur
            $user->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur mis à jour avec succès',
                'user' => $user
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la mise à jour de l\'utilisateur: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'utilisateur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }

    /**
     * Supprimer un utilisateur
     */
    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);

            // Vérifier si l'utilisateur a des boutiques
            if ($user->boutiques()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer cet utilisateur car il possède des boutiques'
                ], 422);
            }

            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur supprimé avec succès'
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Erreur lors de la suppression de l\'utilisateur: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'utilisateur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }

    /**
     * Forcer la suppression d'un utilisateur (avec ses boutiques)
     */
    public function forceDestroy($id)
    {
        try {
            $user = User::findOrFail($id);

            // Supprimer toutes les boutiques de l'utilisateur
            $user->boutiques()->delete();

            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur et ses boutiques supprimés avec succès'
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Erreur lors de la suppression forcée de l\'utilisateur: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'utilisateur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }

    /**
     * Changer le statut actif/inactif d'un utilisateur
     */
    public function toggleStatus($id)
    {
        try {
            $user = User::findOrFail($id);

            $user->update([
                'is_active' => !$user->is_active
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Statut de l\'utilisateur mis à jour',
                'user' => [
                    'id' => $user->id,
                    'is_active' => (bool)$user->is_active
                ]
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Erreur lors du changement de statut: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de statut',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }
}