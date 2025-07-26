<?php

// routes/api.php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BoutiqueController;
use App\Http\Controllers\Api\ProduitController;
use App\Http\Controllers\Api\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Test de base pour vérifier que l'API fonctionne
Route::get('/test', function () {
    return response()->json(['message' => 'API fonctionne correctement']);
});

// Routes d'authentification publiques
Route::post('auth/register', [AuthController::class, 'register']);
Route::post('auth/login', [AuthController::class, 'login']);

// Routes protégées (avec authentification Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});



Route::get('/boutiques', [BoutiqueController::class, 'index']);
Route::get('/boutiques/{id}', [BoutiqueController::class, 'show']);
Route::get('/boutiques/slug/{slug}', [BoutiqueController::class, 'showBySlug']);

// Routes protégées par authentification
Route::middleware('auth:sanctum')->group(function () {
    // Routes pour les boutiques
    Route::post('/boutiques', [BoutiqueController::class, 'store']);
    Route::put('/boutiques/{id}', [BoutiqueController::class, 'update']);
    Route::delete('/boutiques/{id}', [BoutiqueController::class, 'destroy']);
    Route::get('/my-boutiques', [BoutiqueController::class, 'myBoutiques']);
    
    // Route pour récupérer l'utilisateur authentifié
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});



// Routes pour les produits (dans le contexte d'une boutique)
Route::prefix('boutiques/{boutique}')->group(function () {
    // Routes publiques (sans authentification)
    Route::get('produits', [ProduitController::class, 'index']);
    Route::get('produits/{produit}', [ProduitController::class, 'show']);
    
    // Routes protégées (avec authentification)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('produits', [ProduitController::class, 'store']);
        Route::put('produits/{produit}', [ProduitController::class, 'update']);
        Route::delete('produits/{produit}', [ProduitController::class, 'destroy']);
    });
});

// Routes alternatives si vous voulez accéder directement aux produits
Route::middleware('auth:sanctum')->group(function () {
    Route::get('my-produits', [ProduitController::class, 'myProduits']);
    Route::get('produits/search', [ProduitController::class, 'search']);
});