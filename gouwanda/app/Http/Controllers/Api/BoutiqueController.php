<?php

// app/Http/Controllers/Api/BoutiqueController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Boutique;
use App\Models\PlanAbonnement;
use App\Models\Abonnement;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BoutiqueController extends Controller
{
    /**
     * Display a listing of the boutiques.
     */
    public function index()
    {
        try {
            $boutiques = Boutique::with(['user', 'abonnements' => function($query) {
                $query->where('statut', 'actif')
                      ->where('date_fin', '>', now())
                      ->with('plan');
            }])->get();
            
            return response()->json([
                'success' => true,
                'data' => $boutiques,
                'message' => 'Boutiques récupérées avec succès'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des boutiques: ' . $e->getMessage());
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
        DB::beginTransaction();
        
        try {
            // Vérifier l'utilisateur authentifié
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }

            Log::info('Création boutique - Utilisateur ID: ' . $user->id);
            Log::info('Données reçues:', $request->all());

            // Validation des données
            $validatedData = $request->validate([
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

            Log::info('Données validées:', $validatedData);

            // Vérifier si l'utilisateur a déjà une boutique active
            $existingBoutique = Boutique::where('user_id', $user->id)
                ->whereHas('abonnements', function($query) {
                    $query->where('statut', 'actif')
                          ->where('date_fin', '>', now());
                })
                ->first();

            if ($existingBoutique) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous avez déjà une boutique active. Contactez le support pour créer une boutique supplémentaire.'
                ], 403);
            }

            // Générer un slug unique
            $baseSlug = Str::slug($validatedData['nom']);
            $slug = $baseSlug;
            $counter = 1;
            
            while (Boutique::where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }

            Log::info('Slug généré: ' . $slug);

            // Préparer les données pour la création
            $boutiqueData = [
                'user_id' => $user->id,
                'nom' => $validatedData['nom'],
                'slug' => $slug,
                'description' => $validatedData['description'],
                'categorie' => $validatedData['categorie'],
                'couleur_accent' => $validatedData['couleur_accent'] ?? '#F25539',
            ];

            // Ajouter les champs optionnels seulement s'ils sont présents
            if (!empty($validatedData['slogan'])) {
                $boutiqueData['slogan'] = $validatedData['slogan'];
            }

            if (!empty($validatedData['mots_cles'])) {
                $boutiqueData['mots_cles'] = $validatedData['mots_cles'];
            }

            Log::info('Données boutique à créer:', $boutiqueData);

            // Créer la boutique
            $boutique = Boutique::create($boutiqueData);

            Log::info('Boutique créée avec ID: ' . $boutique->id);

            // Gérer l'upload du logo
            if ($request->hasFile('logo')) {
                Log::info('Upload du logo en cours...');
                $path = $request->file('logo')->store('logos', 'public');
                $boutique->update(['logo' => $path]);
                Log::info('Logo uploadé: ' . $path);
            }

            // Créer automatiquement un abonnement gratuit
            $this->createFreeSubscription($boutique->id, $user->id);

            // Charger les relations pour la réponse
            $boutique->load(['user']);
            
            // Recharger la boutique depuis la base de données pour avoir les relations fraîches
            $boutique = Boutique::with(['user', 'abonnements' => function($query) {
                $query->where('statut', 'actif')
                      ->where('date_fin', '>', now())
                      ->with('plan')
                      ->latest();
            }])->find($boutique->id);

            DB::commit();

            Log::info('Boutique créée avec succès - ID: ' . $boutique->id);

            return response()->json([
                'success' => true,
                'data' => $this->formatBoutiqueResponse($boutique),
                'message' => 'Boutique créée avec succès avec le plan gratuit'
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            Log::error('Erreur de validation:', $e->errors());
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de la création de la boutique: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la boutique: ' . $e->getMessage(),
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
            $boutique = Boutique::with(['user', 'abonnements' => function($query) {
                $query->where('statut', 'actif')
                      ->where('date_fin', '>', now())
                      ->with('plan')
                      ->latest();
            }])->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $this->formatBoutiqueResponse($boutique),
                'message' => 'Boutique récupérée avec succès'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Boutique non trouvée'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération de la boutique: ' . $e->getMessage());
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
            $boutique = Boutique::with(['user', 'abonnements' => function($query) {
                $query->where('statut', 'actif')
                      ->where('date_fin', '>', now())
                      ->with('plan')
                      ->latest();
            }])
            ->where('slug', $slug)
            ->firstOrFail();
            
            return response()->json([
                'success' => true,
                'data' => $this->formatBoutiqueResponse($boutique),
                'message' => 'Boutique récupérée avec succès'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Boutique non trouvée'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération de la boutique par slug: ' . $e->getMessage());
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
            $boutique = Boutique::with(['abonnements' => function($query) {
                $query->where('statut', 'actif')
                      ->where('date_fin', '>', now())
                      ->with('plan')
                      ->latest();
            }])->findOrFail($id);
            
            // Vérifier que l'utilisateur connecté est le propriétaire
            if ($boutique->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas autorisé à modifier cette boutique'
                ], 403);
            }

            // Vérifier que l'abonnement est actif
            if (!$this->hasActiveSubscription($boutique)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Votre abonnement a expiré. Veuillez renouveler votre plan pour continuer à utiliser votre boutique.'
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
            $boutique->load(['user', 'abonnements' => function($query) {
                $query->where('statut', 'actif')
                      ->where('date_fin', '>', now())
                      ->with('plan')
                      ->latest();
            }]);

            return response()->json([
                'success' => true,
                'data' => $this->formatBoutiqueResponse($boutique),
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
            Log::error('Erreur lors de la mise à jour de la boutique: ' . $e->getMessage());
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
        DB::beginTransaction();
        
        try {
            $boutique = Boutique::findOrFail($id);
            
            // Vérifier que l'utilisateur connecté est le propriétaire
            if ($boutique->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas autorisé à supprimer cette boutique'
                ], 403);
            }

            // Désactiver tous les abonnements liés à cette boutique
            Abonnement::where('user_id', Auth::id())
                ->where('statut', 'actif')
                ->update(['statut' => 'suspendu']);

            // Supprimer le logo s'il existe
            if ($boutique->logo) {
                Storage::disk('public')->delete($boutique->logo);
            }

            $boutique->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Boutique supprimée avec succès'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Boutique non trouvée'
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de la suppression de la boutique: ' . $e->getMessage());
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
            $boutiques = Boutique::with(['abonnements' => function($query) {
                $query->where('statut', 'actif')
                      ->where('date_fin', '>', now())
                      ->with('plan')
                      ->latest();
            }])
            ->where('user_id', Auth::id())
            ->get();
            
            $formattedBoutiques = $boutiques->map(function ($boutique) {
                return $this->formatBoutiqueResponse($boutique);
            });
            
            return response()->json([
                'success' => true,
                'data' => $formattedBoutiques,
                'message' => 'Vos boutiques récupérées avec succès'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des boutiques utilisateur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de vos boutiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get subscription status for a boutique
     */
    public function getSubscriptionStatus($id)
    {
        try {
            $boutique = Boutique::with(['abonnements' => function($query) {
                $query->where('statut', 'actif')
                      ->where('date_fin', '>', now())
                      ->with('plan')
                      ->latest();
            }])->findOrFail($id);
            
            // Vérifier que l'utilisateur connecté est le propriétaire
            if ($boutique->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas autorisé à voir ces informations'
                ], 403);
            }

            $abonnement = $boutique->abonnements->first();
            $plan = $abonnement ? $abonnement->plan : null;
            $hasActiveSubscription = $this->hasActiveSubscription($boutique);

            $subscriptionData = [
                'boutique_id' => $boutique->id,
                'has_active_subscription' => $hasActiveSubscription,
                'subscription_expired' => $abonnement ? $abonnement->date_fin < now() : true,
                'days_remaining' => $abonnement && $abonnement->date_fin > now() 
                    ? $abonnement->date_fin->diffInDays(now()) 
                    : 0,
                'current_plan' => $plan ? [
                    'id' => $plan->id,
                    'nom' => $plan->nom,
                    'slug' => $plan->slug,
                    'prix' => $plan->prix,
                    'commission' => $plan->commission,
                    'limite_produits' => $plan->limite_produits,
                    'is_free' => $plan->is_free,
                    'features' => $plan->features
                ] : null,
                'subscription_details' => $abonnement ? [
                    'date_debut' => $abonnement->date_debut,
                    'date_fin' => $abonnement->date_fin,
                    'statut' => $abonnement->statut,
                ] : null
            ];

            return response()->json([
                'success' => true,
                'data' => $subscriptionData,
                'message' => 'Statut d\'abonnement récupéré avec succès'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Boutique non trouvée'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération du statut d\'abonnement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du statut d\'abonnement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upgrade subscription plan
     */
    public function upgradeSubscription(Request $request, $id)
    {
        DB::beginTransaction();
        
        try {
            $boutique = Boutique::with(['abonnements' => function($query) {
                $query->where('statut', 'actif')
                      ->where('date_fin', '>', now())
                      ->latest();
            }])->findOrFail($id);
            
            // Vérifier que l'utilisateur connecté est le propriétaire
            if ($boutique->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas autorisé à modifier cet abonnement'
                ], 403);
            }

            $request->validate([
                'plan_id' => 'required|exists:plans_abonnement,id',
                'duree_mois' => 'required|integer|min:1|max:12',
                'reference_paiement' => 'nullable|string'
            ]);

            $newPlan = PlanAbonnement::findOrFail($request->plan_id);
            
            // Ne pas permettre de passer au plan gratuit via cette méthode
            if ($newPlan->is_free) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de passer au plan gratuit via cette méthode'
                ], 422);
            }

            // Désactiver l'ancien abonnement
            $currentAbonnement = $boutique->abonnements->first();
            if ($currentAbonnement) {
                $currentAbonnement->update(['statut' => 'suspendu']);
            }

            // Créer le nouvel abonnement
            $dateDebut = now();
            $dateFin = $dateDebut->copy()->addMonths($request->duree_mois);

            $abonnement = Abonnement::create([
                'user_id' => Auth::id(),
                'plan_id' => $request->plan_id,
                'boutique_id' => $id,
                'date_debut' => $dateDebut,
                'date_fin' => $dateFin,
                'statut' => 'actif',
                'reference_paiement' => $request->reference_paiement
            ]);

            DB::commit();

            // Recharger la boutique avec les nouvelles relations
            $boutique->load(['abonnements' => function($query) {
                $query->where('statut', 'actif')
                      ->where('date_fin', '>', now())
                      ->with('plan')
                      ->latest();
            }]);

            return response()->json([
                'success' => true,
                'data' => [
                    'boutique' => $this->formatBoutiqueResponse($boutique),
                    'abonnement' => $abonnement
                ],
                'message' => 'Abonnement mis à niveau avec succès'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Boutique ou plan non trouvé'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de la mise à niveau de l\'abonnement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à niveau de l\'abonnement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer un abonnement gratuit automatiquement
     */
    private function createFreeSubscription($boutiqueId, $userId)
    {
        try {
            Log::info('Création abonnement gratuit pour boutique ID: ' . $boutiqueId . ', utilisateur ID: ' . $userId);

            // Trouver le plan gratuit
            $planGratuit = PlanAbonnement::where('is_free', true)
                ->where('is_active', true)
                ->first();

            if (!$planGratuit) {
                Log::info('Aucun plan gratuit trouvé, création d\'un nouveau plan gratuit');
                // Si aucun plan gratuit n'existe, en créer un
                $planGratuit = PlanAbonnement::create([
                    'nom' => 'Gratuit',
                    'slug' => 'gratuit',
                    'description' => 'Plan de base pour commencer',
                    'prix' => 0,
                    'commission' => 3,
                    'limite_produits' => 3,
                    'mobile_money' => true,
                    'dashboard_boutique' => true,
                    'is_free' => true,
                    'is_active' => true
                ]);
                Log::info('Plan gratuit créé avec ID: ' . $planGratuit->id);
            } else {
                Log::info('Plan gratuit trouvé avec ID: ' . $planGratuit->id);
            }

            // Préparer les données d'abonnement avec debug
            $abonnementData = [
                'user_id' => $userId,
                'plan_id' => $planGratuit->id,
                'boutique_id' => $boutiqueId,
                'date_debut' => now(),
                'date_fin' => now()->addYears(10), // Durée très longue pour "illimité"
                'statut' => 'actif',
                'created_at' => now(),
                'updated_at' => now()
            ];

            Log::info('Données abonnement à créer:', $abonnementData);

            // Alternative: Utiliser DB::table si le modèle pose problème
            $abonnementId = DB::table('abonnements')->insertGetId($abonnementData);
            
            // Récupérer l'abonnement créé
            $abonnement = Abonnement::find($abonnementId);

            Log::info('Abonnement gratuit créé avec ID: ' . $abonnement->id);
            return $abonnement;

        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de l\'abonnement gratuit: ' . $e->getMessage());
            Log::error('Stack trace abonnement: ' . $e->getTraceAsString());
            throw $e;
        }
    }

    /**
     * Vérifier si une boutique a un abonnement actif
     */
    private function hasActiveSubscription($boutique)
    {
        // Si les abonnements ne sont pas chargés, les charger
        if (!$boutique->relationLoaded('abonnements')) {
            $boutique->load(['abonnements' => function($query) {
                $query->where('statut', 'actif')
                      ->where('date_fin', '>', now())
                      ->latest();
            }]);
        }

        $abonnement = $boutique->abonnements->first();
        
        return $abonnement && 
               $abonnement->statut === 'actif' && 
               $abonnement->date_fin > now();
    }

    /**
     * Formater la réponse de la boutique avec les informations d'abonnement
     */
    private function formatBoutiqueResponse($boutique)
    {
        // S'assurer que les abonnements sont chargés avec la bonne relation
        if (!$boutique->relationLoaded('abonnements')) {
            $boutique->load(['abonnements' => function($query) {
                $query->where('statut', 'actif')
                      ->where('date_fin', '>', now())
                      ->with('plan')
                      ->latest();
            }]);
        }

        // Récupérer l'abonnement actif
        $abonnement = $boutique->abonnements->first();
        $plan = $abonnement && $abonnement->plan ? $abonnement->plan : null;
        
        // Convertir les dates en objets Carbon si ce sont des strings
        $dateFin = $abonnement ? (is_string($abonnement->date_fin) 
            ? Carbon::parse($abonnement->date_fin) 
            : $abonnement->date_fin) 
        : null;

        // Vérifier si l'abonnement est actif
        $hasActiveSubscription = $abonnement && 
                                $abonnement->statut === 'actif' && 
                                $dateFin && $dateFin > now();

        return [
            'id' => $boutique->id,
            'nom' => $boutique->nom,
            'slug' => $boutique->slug,
            'slogan' => $boutique->slogan,
            'description' => $boutique->description,
            'categorie' => $boutique->categorie,
            'couleur_accent' => $boutique->couleur_accent,
            'logo' => $boutique->logo,
            'mots_cles' => $boutique->mots_cles,
            'visit_count' => $boutique->visit_count ?? 0,
            'order_count' => $boutique->order_count ?? 0,
            'created_at' => $boutique->created_at,
            'updated_at' => $boutique->updated_at,
            'user' => $boutique->user,
            'subscription' => [
                'has_active' => $hasActiveSubscription,
                'is_expired' => $abonnement ? ($dateFin ? $dateFin < now() : true) : true,
                'days_remaining' => $abonnement && $dateFin && $dateFin > now() 
                    ? $dateFin->diffInDays(now()) 
                    : 0,
                'current_plan' => $plan ? [
                    'id' => $plan->id,
                    'nom' => $plan->nom,
                    'slug' => $plan->slug,
                    'prix' => $plan->prix,
                    'commission' => $plan->commission,
                    'limite_produits' => $plan->limite_produits,
                    'is_free' => $plan->is_free,
                    'features' => $plan->features ?? []
                ] : null,
                'details' => $abonnement ? [
                    'date_debut' => $abonnement->date_debut,
                    'date_fin' => $abonnement->date_fin,
                    'statut' => $abonnement->statut,
                ] : null
            ]
        ];
    }
}