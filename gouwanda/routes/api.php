<?php

// routes/api.php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BoutiqueController;
use App\Http\Controllers\Api\ProduitController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BoutiqueStatsController;
use App\Http\Controllers\Api\PlanAbonnementController;

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

Route::get('/boutiques/{boutiqueId}/product-limits', [ProduitController::class, 'checkLimits'])
    ->middleware('auth:sanctum');

    // Route pour vérifier les limites de produits
Route::get('boutiques/{boutique}/product-limits', [ProduitController::class, 'checkLimits'])->name('boutiques.product-limits');
    // Nouvelles routes pour les abonnements
    Route::get('boutiques/{id}/subscription-status', [BoutiqueController::class, 'getSubscriptionStatus']);
    Route::post('boutiques/{id}/upgrade-subscription', [BoutiqueController::class, 'upgradeSubscription']);
    
    // Routes Plans d'abonnement
    Route::get('plans', [PlanAbonnementController::class, 'index']);
    Route::get('plans/{id}', [PlanAbonnementController::class, 'show']);
    Route::get('plans/slug/{slug}', [PlanAbonnementController::class, 'showBySlug']);
    Route::post('plans/compare', [PlanAbonnementController::class, 'compare']);
    Route::get('plans/{id}/calculate-price', [PlanAbonnementController::class, 'calculatePrice']);
    
    // Routes pour l'historique et recommandations
    Route::get('my-subscription-history', [PlanAbonnementController::class, 'getUserSubscriptionHistory']);
    Route::get('plan-recommendations', [PlanAbonnementController::class, 'getRecommendations']);
});

// Routes publiques (sans authentification)
Route::get('public/plans', [PlanAbonnementController::class, 'index']);
Route::get('public/plans/{id}', [PlanAbonnementController::class, 'show']);
Route::get('public/plans/slug/{slug}', [PlanAbonnementController::class, 'showBySlug']);
Route::post('public/plans/compare', [PlanAbonnementController::class, 'compare']);
Route::get('public/plans/{id}/calculate-price', [PlanAbonnementController::class, 'calculatePrice']);

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



// Routes protégées par authentification
Route::middleware(['auth:sanctum'])->group(function () {
    
    // Statistiques des boutiques de l'utilisateur
    Route::get('/boutiques/stats', [BoutiqueStatsController::class, 'getAllBoutiquesStats']);
    
    // Statistiques d'une boutique spécifique
    Route::get('/boutiques/{boutiqueId}/stats', [BoutiqueStatsController::class, 'getViewStats']);
    
    // Statistiques simplifiées pour le dashboard
    Route::get('/boutiques/{boutiqueId}/dashboard-stats', [BoutiqueStatsController::class, 'getDashboardStats']);
});

// Routes publiques
Route::group(['prefix' => 'public'], function () {
    
    // Enregistrer une vue de boutique (appelé depuis le frontend public)
    Route::post('/boutiques/{boutiqueSlug}/view', [BoutiqueStatsController::class, 'recordView']);
    
});