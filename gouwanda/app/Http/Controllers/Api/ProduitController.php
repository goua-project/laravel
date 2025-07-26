<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Boutique;
use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProduitController extends Controller
{
    public function store(Request $request, $boutiqueId)
    {
        try {
            // Trouver la boutique
            $boutique = Boutique::findOrFail($boutiqueId);
            
            // Vérifier que l'utilisateur est propriétaire de la boutique
            if ($boutique->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas autorisé à ajouter des produits à cette boutique'
                ], 403);
            }

            // Debug des données reçues
            Log::info('Debug création produit', [
                'boutique_id_requested' => $boutiqueId,
                'user_authenticated' => Auth::check(),
                'user_id' => Auth::id(),
                'boutique_user_id' => $boutique->user_id,
                'request_data' => $request->all()
            ]);

            // Règles de validation
            $rules = [
                'nom' => 'required|string|max:255',
                'description' => 'required|string',
                'prix' => 'required|numeric|min:0',
                'type' => 'required|in:physique,digital,service',
                'stock' => 'nullable|integer|min:0',
                'categorie' => 'nullable|string|max:255',
                'tags' => 'nullable|string',
                'visible' => 'nullable|in:true,false,1,0', 
                
                // Champs pour produits digitaux
                'lien_telechargement' => 'nullable|string|url',
                'type_produit_digital' => 'nullable|string',
                'taille_fichier' => 'nullable|string',
                'duree' => 'nullable|string',
                'format' => 'nullable|string',
                
                // Champs pour produits physiques
                'lieu_expedition' => 'nullable|string',
                'delai_livraison' => 'nullable|string',
                
                // Images - autoriser les fichiers et les URLs
                'images' => 'nullable|array',
                'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'image_urls' => 'nullable|array',
                'image_urls.*' => 'nullable|string|url',
            ];

            // Validation conditionnelle selon le type
            if ($request->type === 'digital') {
                $rules['lien_telechargement'] = 'required|string|url';
            } else if ($request->type === 'physique') {
                $rules['stock'] = 'required|integer|min:0';
            }

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                Log::error('Erreur de validation', [
                    'errors' => $validator->errors(),
                    'request_data' => $request->all()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            Log::info('Données validées', $request->all());

            // Traitement des images
            $imagePaths = [];
            
            // Traiter les fichiers uploadés
            if ($request->hasFile('images')) {
                $files = $request->file('images');
                // Si c'est un seul fichier, le mettre dans un tableau
                if (!is_array($files)) {
                    $files = [$files];
                }
                
                foreach ($files as $image) {
                    if ($image && $image->isValid()) {
                        $path = $image->store('products', 'public');
                        $imagePaths[] = $path;
                    }
                }
            }
            
            // Traiter les URLs d'images
            if ($request->has('image_urls')) {
                $imageUrls = $request->input('image_urls');
                if (is_array($imageUrls)) {
                    foreach ($imageUrls as $url) {
                        if (!empty($url) && filter_var($url, FILTER_VALIDATE_URL)) {
                            $imagePaths[] = $url;
                        }
                    }
                }
            }

            // Gérer le boolean visible
            $visible = true; // valeur par défaut
            if ($request->has('visible')) {
                $visibleValue = $request->input('visible');
                if (is_string($visibleValue)) {
                    $visible = in_array(strtolower($visibleValue), ['true', '1']);
                } else {
                    $visible = (bool) $visibleValue;
                }
            }

            // Créer le produit
            $produit = $boutique->produits()->create([
                'nom' => $request->nom,
                'description' => $request->description,
                'prix' => (float) $request->prix,
                'type' => $request->type,
                'stock' => (int) ($request->stock ?? 0),
                'categorie' => $request->categorie,
                'tags' => $request->tags,
                'visible' => $visible,
                'lien_telechargement' => $request->lien_telechargement,
                'type_produit_digital' => $request->type_produit_digital,
                'taille_fichier' => $request->taille_fichier,
                'duree' => $request->duree,
                'format' => $request->format,
                'lieu_expedition' => $request->lieu_expedition,
                'delai_livraison' => $request->delai_livraison,
                'images' => json_encode($imagePaths), 
            ]);

            Log::info('Produit créé avec succès', ['produit_id' => $produit->id]);

            return response()->json([
                'success' => true,
                'data' => $produit,
                'message' => 'Produit créé avec succès'
            ], 201);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la création du produit', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur interne du serveur: ' . $e->getMessage()
            ], 500);
        }
    }

    public function index($boutiqueId)
    {
        try {
            $boutique = Boutique::findOrFail($boutiqueId);
            $produits = $boutique->produits()->get();

            // Décoder les images JSON pour chaque produit
            $produits->each(function($produit) {
                if ($produit->images && is_string($produit->images)) {
                    $produit->images = json_decode($produit->images, true) ?? [];
                }
            });

            return response()->json([
                'success' => true,
                'data' => $produits
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des produits', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des produits'
            ], 500);
        }
    }

    public function show($boutiqueId, $produitId)
    {
        try {
            $boutique = Boutique::findOrFail($boutiqueId);
            $produit = $boutique->produits()->findOrFail($produitId);

            // Décoder les images JSON
            if ($produit->images && is_string($produit->images)) {
                $produit->images = json_decode($produit->images, true) ?? [];
            }

            return response()->json([
                'success' => true,
                'data' => $produit
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Produit non trouvé'
            ], 404);
        }
    }

    public function update(Request $request, $boutiqueId, $produitId)
    {
        try {
            $boutique = Boutique::findOrFail($boutiqueId);
            
            if ($boutique->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Non autorisé'
                ], 403);
            }

            $produit = $boutique->produits()->findOrFail($produitId);

            // Même validation que pour store
            $rules = [
                'nom' => 'required|string|max:255',
                'description' => 'required|string',
                'prix' => 'required|numeric|min:0',
                'type' => 'required|in:physique,digital,service',
                'stock' => 'nullable|integer|min:0',
                'categorie' => 'nullable|string|max:255',
                'tags' => 'nullable|string',
                'visible' => 'nullable|in:true,false,1,0', 
                
                'lien_telechargement' => 'nullable|string|url',
                'type_produit_digital' => 'nullable|string',
                'taille_fichier' => 'nullable|string',
                'duree' => 'nullable|string',
                'format' => 'nullable|string',
                'lieu_expedition' => 'nullable|string',
                'delai_livraison' => 'nullable|string',
                
                'images' => 'nullable|array',
                'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'image_urls' => 'nullable|array',
                'image_urls.*' => 'nullable|string|url',
            ];

            if ($request->type === 'digital') {
                $rules['lien_telechargement'] = 'required|string|url';
            } else if ($request->type === 'physique') {
                $rules['stock'] = 'required|integer|min:0';
            }

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Traitement des images (même logique que store)
            $imagePaths = [];
            
            if ($request->hasFile('images')) {
                $files = $request->file('images');
                // Si c'est un seul fichier, le mettre dans un tableau
                if (!is_array($files)) {
                    $files = [$files];
                }
                
                foreach ($files as $image) {
                    if ($image && $image->isValid()) {
                        $path = $image->store('products', 'public');
                        $imagePaths[] = $path;
                    }
                }
            }
            
            if ($request->has('image_urls')) {
                $imageUrls = $request->input('image_urls');
                if (is_array($imageUrls)) {
                    foreach ($imageUrls as $url) {
                        if (!empty($url) && filter_var($url, FILTER_VALIDATE_URL)) {
                            $imagePaths[] = $url;
                        }
                    }
                }
            }

            // Si aucune nouvelle image, garder les anciennes
            if (empty($imagePaths) && $produit->images) {
                $imagePaths = is_string($produit->images) ? 
                    json_decode($produit->images, true) : 
                    $produit->images;
            }

            // Gérer le boolean visible
            $visible = $produit->visible; 
            if ($request->has('visible')) {
                $visibleValue = $request->input('visible');
                if (is_string($visibleValue)) {
                    $visible = in_array(strtolower($visibleValue), ['true', '1']);
                } else {
                    $visible = (bool) $visibleValue;
                }
            }

            // Mise à jour du produit
            $produit->update([
                'nom' => $request->nom,
                'description' => $request->description,
                'prix' => (float) $request->prix,
                'type' => $request->type,
                'stock' => (int) ($request->stock ?? 0),
                'categorie' => $request->categorie,
                'tags' => $request->tags,
                'visible' => $visible,
                'lien_telechargement' => $request->lien_telechargement,
                'type_produit_digital' => $request->type_produit_digital,
                'taille_fichier' => $request->taille_fichier,
                'duree' => $request->duree,
                'format' => $request->format,
                'lieu_expedition' => $request->lieu_expedition,
                'delai_livraison' => $request->delai_livraison,
                'images' => json_encode($imagePaths),
            ]);

            return response()->json([
                'success' => true,
                'data' => $produit,
                'message' => 'Produit mis à jour avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($boutiqueId, $produitId)
    {
        try {
            $boutique = Boutique::findOrFail($boutiqueId);
            
            if ($boutique->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Non autorisé'
                ], 403);
            }

            $produit = $boutique->produits()->findOrFail($produitId);
            
            // Supprimer les images du storage si nécessaire
            if ($produit->images) {
                $images = is_string($produit->images) ? 
                    json_decode($produit->images, true) : 
                    $produit->images;
                    
                if (is_array($images)) {
                    foreach ($images as $imagePath) {
                        if (!filter_var($imagePath, FILTER_VALIDATE_URL)) {
                            Storage::disk('public')->delete($imagePath);
                        }
                    }
                }
            }
            
            $produit->delete();

            return response()->json([
                'success' => true,
                'message' => 'Produit supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }
}