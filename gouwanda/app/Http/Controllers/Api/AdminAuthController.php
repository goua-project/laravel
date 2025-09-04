<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    /**
     * Connexion administrateur
     */
    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ], [
                'email.required' => 'L\'adresse email est obligatoire',
                'email.email' => 'L\'adresse email doit être valide',
                'password.required' => 'Le mot de passe est obligatoire',
            ]);

            if (!Auth::attempt($request->only('email', 'password'))) {
                return response()->json([
                    'message' => 'Email ou mot de passe incorrect'
                ], 401);
            }

            $user = Auth::user();
            
            // Vérifier si l'utilisateur est actif
            if (!$user->is_active) {
                Auth::logout();
                return response()->json([
                    'message' => 'Votre compte est désactivé. Contactez l\'administrateur.'
                ], 403);
            }

            // VÉRIFICATION SPÉCIFIQUE POUR L'ADMIN
            if ($user->role !== 'admin') {
                Auth::logout();
                return response()->json([
                    'message' => 'Accès réservé aux administrateurs'
                ], 403);
            }

            $token = $user->createToken('admin-token', ['admin'])->plainTextToken;

            return response()->json([
                'message' => 'Connexion administrateur réussie',
                'user' => [
                    'id' => $user->id,
                    'firstName' => $user->prenom,
                    'lastName' => $user->nom,
                    'email' => $user->email,
                    'phone' => $user->telephone,
                    'location' => $user->localite,
                    'country' => $user->pays,
                    'role' => $user->role,
                ],
                'token' => $token
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Erreur connexion admin: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Une erreur est survenue lors de la connexion',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }

    /**
     * Déconnexion administrateur
     */
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();
            
            return response()->json([
                'message' => 'Déconnexion réussie'
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Erreur déconnexion admin: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Erreur lors de la déconnexion',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }

    /**
     * Vérifier le token administrateur
     */
    public function verify(Request $request)
    {
        $user = $request->user();
        
        if ($user->role !== 'admin') {
            return response()->json([
                'valid' => false,
                'message' => 'Accès non autorisé'
            ], 403);
        }

        return response()->json([
            'valid' => true,
            'user' => [
                'id' => $user->id,
                'firstName' => $user->prenom,
                'lastName' => $user->nom,
                'email' => $user->email,
                'role' => $user->role,
            ]
        ], 200);
    }
}