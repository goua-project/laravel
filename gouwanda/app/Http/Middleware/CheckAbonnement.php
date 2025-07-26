<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckAbonnement
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // Si l'utilisateur n'est pas un vendeur, on passe à la suite
        if (!$user || !$user->hasRole('vendeur')) {
            return $next($request);
        }

        // Routes exemptées de la vérification d'abonnement
        $exemptedRoutes = [
            'abonnements.index',
            'abonnements.show',
            'abonnements.souscrire',
            'abonnements.annuler',
            'abonnements.renouveler',
            'logout',
            'profile.show'
        ];

        if (in_array($request->route()->getName(), $exemptedRoutes)) {
            return $next($request);
        }

        // Vérification de l'abonnement actif
        $abonnement = $user->abonnementActuel();

        // Si pas d'abonnement actif ou abonnement expiré
        if (!$abonnement || !$abonnement->isActive()) {
            // Pour les requêtes AJAX/API
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Vous devez avoir un abonnement actif pour accéder à cette fonctionnalité.',
                    'redirect' => route('abonnements.index')
                ], 403);
            }

            return redirect()->route('abonnements.index')
                ->with('warning', 'Vous devez souscrire à un abonnement pour accéder à cette fonctionnalité.');
        }

        // Vérification des limites de produits pour les abonnements gratuits
        if ($abonnement->plan->is_free && $request->isMethod('post') && $request->routeIs('produits.store')) {
            $nombreProduits = $user->boutiques->flatMap->produits->count();
            
            if ($nombreProduits >= $abonnement->plan->limite_produits) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Vous avez atteint la limite de produits pour votre abonnement gratuit.',
                        'upgrade_url' => route('abonnements.index')
                    ], 403);
                }

                return redirect()->back()
                    ->with('error', 'Vous avez atteint la limite de 3 produits pour l\'abonnement gratuit. Veuillez passer à un abonnement Pro pour ajouter plus de produits.');
            }
        }

        return $next($request);
    }
}