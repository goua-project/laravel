<?php

// app/Http/Controllers/Api/BoutiqueController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Boutique;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class BoutiqueController extends Controller
{
    /**
     * Display a listing of the boutiques.
     */
    public function index()
    {
        try {
            $boutiques = Boutique::with('user')->get();
            
            return response()->json([
                'success' => true,
                'data' => $boutiques,
                'message' => 'Boutiques récupérées avec succès'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des boutiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created boutique in storage.
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'nom' => 'required|string|max:255',
                'slogan' => 'nullable|string|max:255',
                'description' => 'required|string',
                'categorie' => 'required|string|in:physical,digital',
                'couleur_accent' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
                'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'mots_cles' => 'nullable|string',
            ], [
                'nom.required' => 'Le nom de la boutique est obligatoire',
                'nom.max' => 'Le nom ne doit pas dépasser 255 caractères',
                'description.required' => 'La description est obligatoire',
                'categorie.required' => 'La catégorie est obligatoire',
                'categorie.in' => 'La catégorie doit être "physical" ou "digital"',
                'couleur_accent.regex' => 'La couleur d\'accent doit être au format hexadécimal (#RRGGBB)',
                'logo.image' => 'Le logo doit être une image',
                'logo.mimes' => 'Le logo doit être au format JPEG, PNG, JPG ou GIF',
                'logo.max' => 'Le logo ne doit pas dépasser 2MB',
            ]);

            // Générer un slug unique
            $baseSlug = Str::slug($request->nom);
            $slug = $baseSlug;
            $counter = 1;
            
            while (Boutique::where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }

            // Créer la boutique
            $boutique = Boutique::create([
                'user_id' => Auth::id(),
                'nom' => $request->nom,
                'slug' => $slug,
                'slogan' => $request->slogan,
                'description' => $request->description,
                'categorie' => $request->categorie,
                'couleur_accent' => $request->couleur_accent ?? '#F25539',
                'mots_cles' => $request->mots_cles,
            ]);

            // Gérer l'upload du logo
            if ($request->hasFile('logo')) {
                $path = $request->file('logo')->store('logos', 'public');
                $boutique->update(['logo' => $path]);
            }

            // Charger les relations pour la réponse
            $boutique->load('user');

            return response()->json([
                'success' => true,
                'data' => $boutique,
                'message' => 'Boutique créée avec succès'
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la boutique',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified boutique.
     */
    public function show($id)
    {
        try {
            $boutique = Boutique::with('user')->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $boutique,
                'message' => 'Boutique récupérée avec succès'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Boutique non trouvée'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la boutique',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the boutique by slug.
     */
    public function showBySlug($slug)
    {
        try {
            $boutique = Boutique::with('user')->where('slug', $slug)->firstOrFail();
            
            return response()->json([
                'success' => true,
                'data' => $boutique,
                'message' => 'Boutique récupérée avec succès'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Boutique non trouvée'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la boutique',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified boutique in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            $boutique = Boutique::findOrFail($id);
            
            // Vérifier que l'utilisateur connecté est le propriétaire
            if ($boutique->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas autorisé à modifier cette boutique'
                ], 403);
            }

            $request->validate([
                'nom' => 'required|string|max:255',
                'slogan' => 'nullable|string|max:255',
                'description' => 'required|string',
                'categorie' => 'required|string|in:physical,digital',
                'couleur_accent' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
                'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'mots_cles' => 'nullable|string',
            ]);

            $data = $request->except(['logo']);
            
            // Générer un nouveau slug si le nom a changé
            if ($request->nom !== $boutique->nom) {
                $baseSlug = Str::slug($request->nom);
                $slug = $baseSlug;
                $counter = 1;
                
                while (Boutique::where('slug', $slug)->where('id', '!=', $boutique->id)->exists()) {
                    $slug = $baseSlug . '-' . $counter;
                    $counter++;
                }
                
                $data['slug'] = $slug;
            }

            // Gérer l'upload du nouveau logo
            if ($request->hasFile('logo')) {
                // Supprimer l'ancien logo s'il existe
                if ($boutique->logo) {
                    Storage::disk('public')->delete($boutique->logo);
                }
                
                $path = $request->file('logo')->store('logos', 'public');
                $data['logo'] = $path;
            }

            $boutique->update($data);
            $boutique->load('user');

            return response()->json([
                'success' => true,
                'data' => $boutique,
                'message' => 'Boutique mise à jour avec succès'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Boutique non trouvée'
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
                'message' => 'Erreur lors de la mise à jour de la boutique',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified boutique from storage.
     */
    public function destroy($id)
    {
        try {
            $boutique = Boutique::findOrFail($id);
            
            // Vérifier que l'utilisateur connecté est le propriétaire
            if ($boutique->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas autorisé à supprimer cette boutique'
                ], 403);
            }

            // Supprimer le logo s'il existe
            if ($boutique->logo) {
                Storage::disk('public')->delete($boutique->logo);
            }

            $boutique->delete();

            return response()->json([
                'success' => true,
                'message' => 'Boutique supprimée avec succès'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Boutique non trouvée'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la boutique',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get boutiques owned by the authenticated user.
     */
    public function myBoutiques()
    {
        try {
            $boutiques = Boutique::where('user_id', Auth::id())->get();
            
            return response()->json([
                'success' => true,
                'data' => $boutiques,
                'message' => 'Vos boutiques récupérées avec succès'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de vos boutiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}