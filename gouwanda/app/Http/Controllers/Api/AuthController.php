<?php

// app/Http/Controllers/Api/AuthController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Inscription d'un nouvel utilisateur
     */
    public function register(Request $request)
    {
        try {
            // Validation des données - CORRECTION : phone au lieu de telephone dans la règle unique
            $request->validate([
                'firstName' => 'required|string|max:255',
                'lastName' => 'required|string|max:255',
                'phone' => 'required|string|max:255|unique:users,telephone', // Correspondance avec votre table
                'location' => 'required|string|max:255',
                'country' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email',
                'password' => ['required', 'string', 'min:8'],
            ], [
                // Messages d'erreur personnalisés en français
                'firstName.required' => 'Le prénom est obligatoire',
                'lastName.required' => 'Le nom est obligatoire',
                'phone.required' => 'Le numéro de téléphone est obligatoire',
                'phone.unique' => 'Ce numéro de téléphone est déjà utilisé',
                'location.required' => 'La localité est obligatoire',
                'country.required' => 'Le pays est obligatoire',
                'email.required' => 'L\'adresse email est obligatoire',
                'email.email' => 'L\'adresse email doit être valide',
                'email.unique' => 'Cette adresse email est déjà utilisée',
                'password.required' => 'Le mot de passe est obligatoire',
                'password.min' => 'Le mot de passe doit contenir au moins 8 caractères',
            ]);

            $user = User::create([
                'prenom' => $request->firstName,
                'nom' => $request->lastName,
                'telephone' => $request->phone,
                'localite' => $request->location,
                'pays' => $request->country,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'client', // Rôle par défaut
                'is_active' => true, // Actif par défaut
            ]);

            // Créer un token d'authentification
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'message' => 'Utilisateur créé avec succès',
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
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Erreur inscription: ' . $e->getMessage(), [
                'request_data' => $request->except('password'),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Une erreur est survenue lors de l\'inscription',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }

    /**
     * Connexion utilisateur
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

            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'message' => 'Connexion réussie',
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
            \Log::error('Erreur connexion: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Une erreur est survenue lors de la connexion',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }

    /**
     * Déconnexion utilisateur
     */
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();
            
            return response()->json([
                'message' => 'Déconnexion réussie'
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Erreur déconnexion: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Erreur lors de la déconnexion',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }

    /**
     * Obtenir les informations de l'utilisateur connecté
     */
    public function me(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'user' => [
                'id' => $user->id,
                'firstName' => $user->prenom,
                'lastName' => $user->nom,
                'email' => $user->email,
                'phone' => $user->telephone,
                'location' => $user->localite,
                'country' => $user->pays,
                'role' => $user->role,
                'isActive' => $user->is_active,
            ]
        ], 200);
    }
}