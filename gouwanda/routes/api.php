<?php

// routes/api.php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BoutiqueController;
use App\Http\Controllers\Api\ProduitController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BoutiqueStatsController;
use App\Http\Controllers\Api\PlanAbonnementController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\AdminBoutiqueController;
use App\Http\Controllers\Api\KaliaPayController;
use App\Http\Controllers\Api\CommandeController;
use App\Http\Controllers\Api\AdminCommandeController;
use App\Http\Controllers\Api\AdminProduitController;
use App\Http\Controllers\BoutiqueTrendsController;

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

// Route publique pour obtenir le nombre de vues (sans authentification)
Route::get('/boutiques/stats/{id}/public/view-count', [BoutiqueStatsController::class, 'getPublicViewCount']);

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
    

    Route::get('/user/subscription', [PlanAbonnementController::class, 'getUserSubscriptionHistory']);
    
    // Ou si vous voulez une route pour l'abonnement actuel uniquement :
    Route::get('/user/subscription/current', [PlanAbonnementController::class, 'getCurrentSubscription']);
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




// Alternative recommandée: Structure plus claire
Route::prefix('boutiques')->group(function () {
    
    // Routes pour l'enregistrement des vues (publiques)
    Route::prefix('views')->group(function () {
        Route::post('record/{slug}', [BoutiqueStatsController::class, 'recordViewBySlug'])
            ->name('boutique.views.record-slug');
        
        Route::post('record/id/{id}', [BoutiqueStatsController::class, 'recordViewById'])
            ->name('boutique.views.record-id')
            ->where('id', '[0-9]+');
    });
    
    // Routes pour les statistiques (désormais publiques)
    Route::prefix('stats')->group(function () {
        
        // Route pour toutes les boutiques de l'utilisateur
        Route::get('/', [BoutiqueStatsController::class, 'getAllBoutiquesStats'])
            ->name('boutique.stats.all');
        
        // Routes spécifiques par boutique
        Route::prefix('{id}')->where(['id' => '[0-9]+'])->group(function () {
            Route::get('/', [BoutiqueStatsController::class, 'getBoutiqueStats'])
                ->name('boutique.stats.show');
            
            Route::get('dashboard', [BoutiqueStatsController::class, 'getDashboardStats'])
                ->name('boutique.stats.dashboard');
        });
    });
});

Route::get('/boutiques/stats/{id}/view-count', [BoutiqueStatsController::class, 'getViewCount'])
    ->middleware('auth:sanctum');

    // Routes publiques pour les statistiques des boutiques (sans authentification)
Route::get('/boutiques/stats/public/{id}/view-count', [BoutiqueStatsController::class, 'getPublicViewCount']);
Route::get('/boutiques/stats/public/slug/{slug}/view-count', [BoutiqueStatsController::class, 'getPublicViewCountBySlug']);

# Dans routes/api.php
Route::post('boutiques/views/force-record/{slug}', [BoutiqueStatsController::class, 'recordViewBySlugForced']);
Route::post('boutiques/views/extended-record/{slug}', [BoutiqueStatsController::class, 'recordViewBySlugExtended']);

// Dans routes/api.php ou web.php
Route::prefix('boutiques/views')->group(function () {
    Route::post('record/{slug}', [BoutiqueStatsController::class, 'recordViewBySlug']);
    Route::post('force-record/{slug}', [BoutiqueStatsController::class, 'recordViewBySlugForced']);
    Route::post('extended-record/{slug}', [BoutiqueStatsController::class, 'recordViewBySlugExtended']);
});

Route::prefix('admin')->group(function () {
    Route::post('/auth/login', [AdminAuthController::class, 'login']);
    Route::post('/auth/logout', [AdminAuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/auth/verify', [AdminAuthController::class, 'verify'])->middleware('auth:sanctum');
});

// Routes d'authentification administration
Route::prefix('admin')->group(function () {
    Route::post('/auth/login', [AdminAuthController::class, 'login']);
    Route::post('/auth/logout', [AdminAuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/auth/verify', [AdminAuthController::class, 'verify'])->middleware('auth:sanctum');
});

Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
    // Routes de gestion des utilisateurs
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::get('/users/{id}', [AdminUserController::class, 'show']);
    Route::put('/users/{id}', [AdminUserController::class, 'update']);
    Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
    Route::delete('/users/{id}/force', [AdminUserController::class, 'forceDestroy']);
    Route::patch('/users/{id}/toggle-status', [AdminUserController::class, 'toggleStatus']);
});


Route::prefix('admin')->group(function () {
     Route::get('boutiques/all-with-stats', [BoutiqueTrendsController::class, 'getAllBoutiquesWithStats']);
    Route::get('/boutiques', [AdminBoutiqueController::class, 'index']);
    Route::get('/boutiques/{id}', [AdminBoutiqueController::class, 'show']);
    Route::put('/boutiques/{id}', [AdminBoutiqueController::class, 'update']);
    Route::patch('/boutiques/{id}/toggle-status', [AdminBoutiqueController::class, 'toggleStatus']);
    Route::post('/boutiques/{id}/logo', [AdminBoutiqueController::class, 'updateLogo']);
    Route::get('/boutiques/{id}/statistics', [AdminBoutiqueController::class, 'getStatistics']);
    Route::get('/boutiques/{id}/subscriptions', [AdminBoutiqueController::class, 'getSubscriptions']);
    Route::post('/boutiques/{id}/subscriptions', [AdminBoutiqueController::class, 'createSubscription']);
    Route::put('/boutiques/{boutiqueId}/subscriptions/{abonnementId}', [AdminBoutiqueController::class, 'updateSubscription']);
    Route::get('/boutiques/{id}/products', [AdminBoutiqueController::class, 'getProducts']);
    Route::delete('/boutiques/{id}', [AdminBoutiqueController::class, 'destroy']);
    Route::delete('/boutiques/{id}/force', [AdminBoutiqueController::class, 'forceDestroy']);
});


Route::middleware('auth:api')->group(function () {
    // Paiements KaliaPay
    Route::post('paiement/webpay/redirect', [KaliaPayController::class, 'initierWebPayRedirect']);
    Route::post('paiement/webpay/url', [KaliaPayController::class, 'getPaymentUrl']);
    Route::post('paiement/mobpay/qrcode', [KaliaPayController::class, 'genererQRCodeMobPay']);
    Route::post('paiement/eshoppay/qrcode', [KaliaPayController::class, 'genererQRCodeEshopPay']);
    Route::get('paiement/statut/{reference}', [KaliaPayController::class, 'verifierStatutTransaction']);
});


// Routes protégées par authentification
Route::middleware(['auth:sanctum'])->group(function () {
    
    // CRUD des commandes
    Route::prefix('commandes')->name('commandes.')->group(function () {
        Route::get('/', [CommandeController::class, 'index'])->name('index');
        Route::post('/', [CommandeController::class, 'store'])->name('store');
        Route::get('/statistiques', [CommandeController::class, 'statistiques'])->name('statistiques');
        Route::get('/{id}', [CommandeController::class, 'show'])->name('show');
        Route::post('/{id}/annuler', [CommandeController::class, 'annuler'])->name('annuler');
        
        // Routes spécifiques KaliaPay
        Route::get('/{id}/kalia-status', [CommandeController::class, 'verifierStatutPaiementKalia'])->name('kalia.status');
        Route::post('/{id}/relancer-kalia', [CommandeController::class, 'relancerPaiementKalia'])->name('kalia.relancer');
    });
    
    // Routes des paiements
    Route::prefix('paiements')->name('paiements.')->group(function () {
        Route::post('/{reference}/success', [CommandeController::class, 'callbackPaiementSuccess'])->name('success');
        Route::post('/{reference}/echec', [CommandeController::class, 'callbackPaiementEchec'])->name('echec');
    });
});

// Routes publiques pour les callbacks/webhooks (sans authentification)
Route::prefix('webhooks')->name('webhooks.')->group(function () {
    Route::post('/kaliapay', [CommandeController::class, 'webhookKaliaPay'])->name('kaliapay');
    Route::post('/kaliapay/success', [CommandeController::class, 'callbackKaliaPaySuccess'])->name('kaliapay.success');
});

// Callback public (sans auth)
Route::post('paiement/kaliapay/callback', [KaliaPayController::class, 'handleKaliaPayCallback']);


// Routes d'administration des commandes
Route::prefix('admin')->group(function () {
    Route::get('/commandes', [AdminCommandeController::class, 'index']);
    Route::get('/commandes/{id}', [AdminCommandeController::class, 'show']);
    Route::patch('/commandes/{id}/statut', [AdminCommandeController::class, 'updateStatus']);
    Route::post('/commandes/{id}/annuler', [AdminCommandeController::class, 'annuler']);
    Route::get('/commandes/statistiques', [AdminCommandeController::class, 'statistiques']);
    Route::get('/commandes/exporter', [AdminCommandeController::class, 'exporter']);
    Route::get('/commandes/search', [AdminCommandeController::class, 'search']);
});

Route::middleware(['auth:sanctum'])->group(function () {
    // Routes pour l'administration des produits
    Route::prefix('admin')->group(function () {
        Route::get('/produits', [AdminProduitController::class, 'index']);
        Route::get('/produits/{id}', [AdminProduitController::class, 'show']);
        // Ajoutez d'autres routes admin si nécessaire
        Route::put('/produits/{id}', [AdminProduitController::class, 'update']);
        Route::delete('/produits/{id}', [AdminProduitController::class, 'destroy']);
    });
});



Route::prefix('boutiques')->group(function () {
    // Routes pour les statistiques
    Route::get('{boutiqueId}/views-stats', [BoutiqueTrendsController::class, 'getViewsStats']);
    Route::get('{boutiqueId}/orders-stats', [BoutiqueTrendsController::class, 'getOrdersStats']);
    Route::get('{boutiqueId}/detailed-views', [BoutiqueTrendsController::class, 'getDetailedViews']);
    Route::get('{boutiqueId}/detailed-orders', [BoutiqueTrendsController::class, 'getDetailedOrders']);
    Route::get('{boutiqueId}/top-products', [BoutiqueTrendsController::class, 'getTopProducts']);
    Route::get('{boutiqueId}/payments-stats', [BoutiqueTrendsController::class, 'getPaymentsStats']);

    // Routes pour les produits
    Route::get('{boutiqueId}/products', [BoutiqueTrendsController::class, 'getBoutiqueProducts']);
});



Route::prefix('boutiques')->group(function () {
    // Routes pour les statistiques
    Route::get('{boutiqueId}/views-stats', [BoutiqueTrendsController::class, 'getViewsStats']);
    Route::get('{boutiqueId}/orders-stats', [BoutiqueTrendsController::class, 'getOrdersStats']);
    Route::get('{boutiqueId}/detailed-views', [BoutiqueTrendsController::class, 'getDetailedViews']);
    Route::get('{boutiqueId}/detailed-orders', [BoutiqueTrendsController::class, 'getDetailedOrders']);
    Route::get('{boutiqueId}/top-products', [BoutiqueTrendsController::class, 'getTopProducts']);
    Route::get('{boutiqueId}/payments-stats', [BoutiqueTrendsController::class, 'getPaymentsStats']);

    // Routes pour les produits
    Route::get('{boutiqueId}/products', [BoutiqueTrendsController::class, 'getBoutiqueProducts']);
});     




Route::middleware(['auth:sanctum'])->group(function () {
    
    // Routes pour la gestion des commandes d'une boutique
    Route::prefix('boutiques/{boutiqueId}')->group(function () {
        
        // Lister les commandes d'une boutique
        Route::get('/commandes', [App\Http\Controllers\Api\BoutiqueCommandeController::class, 'listerCommandesBoutique'])
            ->name('boutique.commandes.index');
        
        // Obtenir les statistiques d'une boutique
        Route::get('/statistiques', [App\Http\Controllers\Api\BoutiqueCommandeController::class, 'obtenirStatistiquesBoutique'])
            ->name('boutique.statistiques');
        
        // Obtenir les détails d'une commande spécifique
        Route::get('/commandes/{commandeId}', [App\Http\Controllers\Api\BoutiqueCommandeController::class, 'obtenirDetailsCommande'])
            ->name('boutique.commandes.show');
        
        // Mettre à jour le statut d'une commande
        Route::patch('/commandes/{commandeId}/statut', [App\Http\Controllers\Api\BoutiqueCommandeController::class, 'mettreAJourStatutCommande'])
            ->name('boutique.commandes.update-status');
        
        // Exporter les commandes en CSV
        Route::get('/commandes/export', [App\Http\Controllers\Api\BoutiqueCommandeController::class, 'exporterCommandesCSV'])
            ->name('boutique.commandes.export');
        
        // Obtenir les clients de la boutique
        Route::get('/clients', [App\Http\Controllers\Api\BoutiqueCommandeController::class, 'obtenirClientsBoutique'])
            ->name('boutique.clients.index');
    });
    
    // Routes alternatives si vous préférez une structure différente
    /*
    Route::prefix('boutique-commandes')->group(function () {
        Route::get('/{boutiqueId}', [App\Http\Controllers\Api\BoutiqueCommandeController::class, 'listerCommandesBoutique']);
        Route::get('/{boutiqueId}/statistiques', [App\Http\Controllers\Api\BoutiqueCommandeController::class, 'obtenirStatistiquesBoutique']);
        Route::get('/{boutiqueId}/clients', [App\Http\Controllers\Api\BoutiqueCommandeController::class, 'obtenirClientsBoutique']);
        Route::patch('/{boutiqueId}/{commandeId}/statut', [App\Http\Controllers\Api\BoutiqueCommandeController::class, 'mettreAJourStatutCommande']);
        Route::get('/{boutiqueId}/export', [App\Http\Controllers\Api\BoutiqueCommandeController::class, 'exporterCommandesCSV']);
    });
    */
});