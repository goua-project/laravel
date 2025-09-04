<?php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\CommandeProduit;
use App\Models\Paiement;
use App\Models\Produit;
use App\Models\Boutique;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CommandeController extends Controller
{
    /**
     * Créer une nouvelle commande
     */
    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            $validator = Validator::make($request->all(), [
                'boutique_id' => 'required|exists:boutiques,id',
                'produits' => 'required|array|min:1',
                'produits.*.id' => 'required|exists:produits,id',
                'produits.*.quantite' => 'required|integer|min:1',
                'methode_paiement' => 'required|in:en_ligne,a_la_livraison',
                'adresse_livraison' => 'required_if:methode_paiement,en_ligne|string',
                'notes' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth()->user();
            $boutique = Boutique::findOrFail($request->boutique_id);

            // Calculer le montant total
            $montantTotal = 0;
            $produitsACommander = [];

            foreach ($request->produits as $produitData) {
                $produit = Produit::findOrFail($produitData['id']);
                
                // Vérifier le stock
                if ($produit->stock < $produitData['quantite']) {
                    throw new \Exception("Stock insuffisant pour le produit: " . $produit->nom);
                }

                $sousTotal = $produit->prix * $produitData['quantite'];
                $montantTotal += $sousTotal;

                $produitsACommander[] = [
                    'produit' => $produit,
                    'quantite' => $produitData['quantite'],
                    'prix_unitaire' => $produit->prix,
                    'sous_total' => $sousTotal
                ];
            }

            // Calculer les frais de commission (exemple: 5%)
            $fraisCommission = $montantTotal * 0.05;

            // Créer la commande
            $commande = Commande::create([
                'user_id' => $user->id,
                'boutique_id' => $boutique->id,
                'reference' => 'CMD-' . Str::upper(Str::random(10)),
                'montant_total' => $montantTotal,
                'frais_commission' => $fraisCommission,
                'statut' => $request->methode_paiement === 'en_ligne' ? 'en_attente' : 'payee',
                'methode_paiement' => $request->methode_paiement,
                'adresse_livraison' => $request->adresse_livraison,
                'notes' => $request->notes
            ]);

            // Ajouter les produits à la commande
            foreach ($produitsACommander as $produitData) {
                CommandeProduit::create([
                    'commande_id' => $commande->id,
                    'produit_id' => $produitData['produit']->id,
                    'quantite' => $produitData['quantite'],
                    'prix_unitaire' => $produitData['prix_unitaire']
                ]);

                // Mettre à jour le stock
                $produitData['produit']->decrement('stock', $produitData['quantite']);
            }

            // Gérer le paiement selon la méthode
            if ($request->methode_paiement === 'en_ligne') {
                $paiement = $this->creerPaiementEnLigne($commande);
            } else {
                $paiement = $this->creerPaiementLivraison($commande);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'commande' => $commande,
                'paiement' => $paiement,
                'message' => $request->methode_paiement === 'en_ligne' 
                    ? 'Commande créée. Veuillez procéder au paiement.' 
                    : 'Commande créée avec paiement à la livraison.'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la commande: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer un paiement en ligne
     */
    private function creerPaiementEnLigne(Commande $commande)
    {
        return Paiement::create([
            'commande_id' => $commande->id,
            'montant' => $commande->montant_total,
            'methode' => 'carte_bancaire',
            'reference' => 'PAY-' . Str::upper(Str::random(10)),
            'statut' => 'initie',
            'details' => json_encode([
                'type' => 'en_ligne',
                'url_paiement' => $this->genererUrlPaiement($commande),
                'date_expiration' => now()->addHours(24)
            ])
        ]);
    }

    /**
     * Créer un paiement à la livraison
     */
    private function creerPaiementLivraison(Commande $commande)
    {
        return Paiement::create([
            'commande_id' => $commande->id,
            'montant' => $commande->montant_total,
            'methode' => 'especes_livraison',
            'reference' => 'PAY-' . Str::upper(Str::random(10)),
            'statut' => 'en_attente',
            'details' => json_encode([
                'type' => 'a_la_livraison',
                'a_payer_livraison' => true
            ])
        ]);
    }

    /**
     * Générer une URL de paiement (simulé)
     */
    private function genererUrlPaiement(Commande $commande)
    {
        // Ici vous intégrerez votre gateway de paiement (Stripe, PayPal, etc.)
        return url('/paiement/' . $commande->reference);
    }

    /**
     * Traiter le callback de paiement
     */
    public function callbackPaiement(Request $request, $reference)
    {
        DB::beginTransaction();

        try {
            $paiement = Paiement::where('reference', $reference)->firstOrFail();
            $commande = $paiement->commande;

            $validator = Validator::make($request->all(), [
                'statut' => 'required|in:paye,echec',
                'transaction_id' => 'required_if:statut,paye|string',
                'details' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // Mettre à jour le paiement
            $paiement->update([
                'statut' => $request->statut,
                'details' => json_encode(array_merge(
                    json_decode($paiement->details, true),
                    $request->details ?? []
                ))
            ]);

            if ($request->has('transaction_id')) {
                $paiement->update(['transaction_id' => $request->transaction_id]);
                $commande->update(['transaction_id' => $request->transaction_id]);
            }

            // Mettre à jour le statut de la commande
            if ($request->statut === 'paye') {
                $commande->update(['statut' => 'payee']);
            } elseif ($request->statut === 'echec') {
                $commande->update(['statut' => 'annulee']);
                $this->restaurerStock($commande);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Paiement traité avec succès',
                'commande' => $commande->fresh(),
                'paiement' => $paiement->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du traitement du paiement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurer le stock en cas d'annulation
     */
    private function restaurerStock(Commande $commande)
    {
        foreach ($commande->produits as $produit) {
            $produit->increment('stock', $produit->pivot->quantite);
        }
    }

    /**
     * Lister les commandes d'un utilisateur
     */
    public function index()
    {
        $user = auth()->user();
        $commandes = Commande::with(['produits', 'boutique', 'paiement'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'commandes' => $commandes
        ]);
    }

    /**
     * Afficher une commande spécifique
     */
    public function show($id)
    {
        $user = auth()->user();
        $commande = Commande::with(['produits', 'boutique', 'paiement'])
            ->where('user_id', $user->id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'commande' => $commande
        ]);
    }

    /**
     * Annuler une commande
     */
    public function annuler($id)
    {
        DB::beginTransaction();

        try {
            $user = auth()->user();
            $commande = Commande::where('user_id', $user->id)->findOrFail($id);

            // Vérifier si la commande peut être annulée
            if (!in_array($commande->statut, ['en_attente', 'payee'])) {
                throw new \Exception('Impossible d\'annuler cette commande.');
            }

            // Annuler le paiement si existant
            if ($commande->paiement) {
                $commande->paiement->update(['statut' => 'rembourse']);
            }

            // Mettre à jour le statut de la commande
            $commande->update(['statut' => 'annulee']);

            // Restaurer le stock
            $this->restaurerStock($commande);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Commande annulée avec succès',
                'commande' => $commande->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour le statut d'une commande (pour admin/boutique)
     */
    public function updateStatut(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'statut' => 'required|in:en_attente,payee,en_cours,livree,annulee'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $commande = Commande::findOrFail($id);
        
        // Vérifier les permissions (à adapter selon votre système d'authentification)
        $user = auth()->user();
        if ($user->cannot('update', $commande)) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé'
            ], 403);
        }

        $commande->update(['statut' => $request->statut]);

        return response()->json([
            'success' => true,
            'message' => 'Statut de la commande mis à jour',
            'commande' => $commande->fresh()
        ]);
    }
}<?php

// app/Http/Controllers/CommandeController.php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\Boutique;
use Illuminate\Http\Request;

class CommandeController extends Controller
{
    public function index(Boutique $boutique)
    {
        $commandes = $boutique->commandes()->with('user')->latest()->get();
        return view('commandes.index', compact('boutique', 'commandes'));
    }

    public function show(Commande $commande)
    {
        $commande->load('produits', 'user');
        return view('commandes.show', compact('commande'));
    }

    public function updateStatut(Request $request, Commande $commande)
    {
        $request->validate([
            'statut' => 'required|in:en_attente,payee,en_cours,livree,annulee',
        ]);

        $commande->update(['statut' => $request->statut]);

        // Envoyer une notification au client si nécessaire

        return back()->with('success', 'Statut de la commande mis à jour.');
    }

    // ... autres méthodes
}

    public function destroy(Commande $commande)
    {
        $commande->delete();
        return redirect()->route('boutiques.commandes.index', $commande->boutique)->with('success', 'Commande supprimée avec succès.');
    }
}
