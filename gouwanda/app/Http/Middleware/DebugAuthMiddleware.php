<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\PersonalAccessToken;

class DebugAuthMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        // Debug complet des headers d'authentification
        $authHeader = $request->header('Authorization');
        $token = null;
        
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, 7);
        }

        Log::info('🔍 DEBUG AUTH MIDDLEWARE', [
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'has_auth_header' => !empty($authHeader),
            'auth_header_preview' => $authHeader ? substr($authHeader, 0, 20) . '...' : null,
            'token_length' => $token ? strlen($token) : 0,
            'token_preview' => $token ? substr($token, 0, 10) . '...' : null,
            'user_id' => auth()->id(),
            'user_authenticated' => auth()->check(),
            'ip' => $request->ip(),
            'user_agent' => $request->header('User-Agent'),
            'all_headers' => $request->headers->all(),
        ]);

        // Si on a un token, vérifier sa validité
        if ($token) {
            try {
                $accessToken = PersonalAccessToken::findToken($token);
                
                Log::info('🔑 TOKEN VALIDATION', [
                    'token_found' => !empty($accessToken),
                    'token_id' => $accessToken?->id,
                    'user_id' => $accessToken?->tokenable_id,
                    'token_name' => $accessToken?->name,
                    'created_at' => $accessToken?->created_at,
                    'last_used_at' => $accessToken?->last_used_at,
                    'expires_at' => $accessToken?->expires_at,
                ]);

                if ($accessToken && $accessToken->tokenable) {
                    Log::info('👤 TOKEN USER INFO', [
                        'user_id' => $accessToken->tokenable->id,
                        'user_email' => $accessToken->tokenable->email,
                        'user_name' => $accessToken->tokenable->name,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('❌ ERROR VALIDATING TOKEN', [
                    'error' => $e->getMessage(),
                    'token_preview' => substr($token, 0, 10) . '...'
                ]);
            }
        }

        $response = $next($request);

        // Log de la réponse
        Log::info('📤 AUTH DEBUG RESPONSE', [
            'status' => $response->getStatusCode(),
            'content_preview' => substr($response->getContent(), 0, 200) . '...',
        ]);

        return $response;
    }
}