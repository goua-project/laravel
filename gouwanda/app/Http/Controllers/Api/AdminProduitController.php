<?php

namespace App\Http\Controllers\Api;

use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;

class AdminProduitController extends Controller
{
    /**
     * Récupérer tous les produits avec leurs boutiques
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $produits = Produit::with(['boutique' => function($query) {
                    $query->select('id', 'nom', 'user_id');
                }])
                ->orderBy('created_at', 'desc')
                ->get();

            $produitsTransformes = $produits->map(function ($produit) {
                return [
                    'id' => $produit->id,
                    'nom' => $produit->nom,
                    'description' => $produit->description,
                    'prix' => (float) $produit->prix,
                    'type' => $produit->type,
                    'stock' => (int) $produit->stock,
                    'categorie' => $produit->categorie,
                    'visible' => (bool) $produit->visible,
                    'images' => $produit->images ? json_decode($produit->images) : [],
                    'created_at' => $produit->created_at,
                    'updated_at' => $produit->updated_at,
                    'boutique' => $produit->boutique ? [
                        'id' => $produit->boutique->id,
                        'nom' => $produit->boutique->nom
                    ] : null
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $produitsTransformes,
                'message' => 'Produits récupérés avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des produits: ' . $e->getMessage()
            ], 500);
        }
    }
}