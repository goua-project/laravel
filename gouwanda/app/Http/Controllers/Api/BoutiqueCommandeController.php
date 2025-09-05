<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Boutique;
use App\Models\Commande;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BoutiqueCommandeController extends Controller
{
    /**
     * Lister les commandes d'une boutique
     */
    public function listerCommandesBoutique(Request $request, $boutiqueId)
    {
        try {
            $boutique = Boutique::findOrFail($boutiqueId);
            
            // Vérifier que l'utilisateur est propriétaire de la boutique
            if ($boutique->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette boutique'
                ], 403);
            }

            $query = Commande::with(['user', 'produits', 'paiement'])
                ->where('boutique_id', $boutiqueId);

            // Filtres
            if ($request->filled('statut')) {
                $query->where('statut', $request->statut);
            }

            if ($request->filled('methode_paiement')) {
                $query->where('methode_paiement', $request->methode_paiement);
            }

            if ($request->filled('date_debut')) {
                $query->whereDate('created_at', '>=', $request->date_debut);
            }

            if ($request->filled('date_fin')) {
                $query->whereDate('created_at', '<=', $request->date_fin);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('reference', 'LIKE', "%{$search}%")
                      ->orWhereHas('user', function($userQuery) use ($search) {
                          $userQuery->where('nom', 'LIKE', "%{$search}%")
                                   ->orWhere('prenom', 'LIKE', "%{$search}%")
                                   ->orWhere('email', 'LIKE', "%{$search}%")
                                   ->orWhere('telephone', 'LIKE', "%{$search}%");
                      });
                });
            }

            // Pagination
            $commandes = $query->orderBy('created_at', 'desc')
                              ->paginate($request->get('per_page', 15));

            // Formatter les données
            $commandes->getCollection()->transform(function ($commande) {
                return [
                    'id' => $commande->id,
                    'reference' => $commande->reference,
                    'montant_total' => $commande->montant_total,
                    'frais_commission' => $commande->frais_commission,
                    'statut' => $commande->statut,
                    'methode_paiement' => $commande->methode_paiement,
                    'transaction_id' => $commande->transaction_id,
                    'adresse_livraison' => $commande->adresse_livraison,
                    'notes' => $commande->notes,
                    'created_at' => $commande->created_at,
                    'updated_at' => $commande->updated_at,
                    'user' => $commande->user ? [
                        'id' => $commande->user->id,
                        'nom' => $commande->user->nom,
                        'prenom' => $commande->user->prenom,
                        'email' => $commande->user->email,
                        'telephone' => $commande->user->telephone,
                        'localite' => $commande->user->localite,
                        'pays' => $commande->user->pays
                    ] : null,
                    'produits' => $commande->produits->map(function ($produit) {
                        return [
                            'id' => $produit->id,
                            'nom' => $produit->nom,
                            'prix' => $produit->pivot->prix_unitaire,
                            'quantite' => $produit->pivot->quantite,
                            'sous_total' => $produit->pivot->sous_total
                        ];
                    }),
                    'paiement' => $commande->paiement ? [
                        'id' => $commande->paiement->id,
                        'montant' => $commande->paiement->montant,
                        'methode' => $commande->paiement->methode,
                        'reference' => $commande->paiement->reference,
                        'statut' => $commande->paiement->statut,
                        'created_at' => $commande->paiement->created_at
                    ] : null
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Commandes récupérées avec succès',
                'data' => $commandes
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des commandes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques d'une boutique
     */
    public function obtenirStatistiquesBoutique($boutiqueId)
    {
        try {
            $boutique = Boutique::findOrFail($boutiqueId);
            
            if ($boutique->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette boutique'
                ], 403);
            }

            // Statistiques générales
            $totalCommandes = Commande::where('boutique_id', $boutiqueId)->count();
            
            $chiffreAffaires = Commande::where('boutique_id', $boutiqueId)
                ->whereIn('statut', ['payee', 'livree'])
                ->sum('montant_total');
            
            $clientsUniques = Commande::where('boutique_id', $boutiqueId)
                ->distinct('user_id')
                ->count('user_id');
            
            $commandeMoyenne = $totalCommandes > 0 ? 
                Commande::where('boutique_id', $boutiqueId)->avg('montant_total') : 0;

            // Statistiques par statut
            $statistiquesStatut = Commande::where('boutique_id', $boutiqueId)
                ->select('statut', DB::raw('COUNT(*) as total'), DB::raw('SUM(montant_total) as montant'))
                ->groupBy('statut')
                ->get()
                ->keyBy('statut');

            // Statistiques par méthode de paiement
            $statistiquesPaiement = Commande::where('boutique_id', $boutiqueId)
                ->select('methode_paiement', DB::raw('COUNT(*) as total'), DB::raw('SUM(montant_total) as montant'))
                ->groupBy('methode_paiement')
                ->get()
                ->keyBy('methode_paiement');

            // Évolution des commandes (7 derniers jours)
            $evolutionCommandes = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $count = Commande::where('boutique_id', $boutiqueId)
                    ->whereDate('created_at', $date)
                    ->count();
                $evolutionCommandes[] = [
                    'date' => $date->format('Y-m-d'),
                    'commandes' => $count
                ];
            }

            // Évolution du chiffre d'affaires (7 derniers jours)
            $evolutionCA = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $montant = Commande::where('boutique_id', $boutiqueId)
                    ->whereIn('statut', ['payee', 'livree'])
                    ->whereDate('created_at', $date)
                    ->sum('montant_total');
                $evolutionCA[] = [
                    'date' => $date->format('Y-m-d'),
                    'chiffre_affaires' => $montant
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Statistiques récupérées avec succès',
                'data' => [
                    'total_commandes' => $totalCommandes,
                    'chiffre_affaires' => $chiffreAffaires,
                    'clients_uniques' => $clientsUniques,
                    'commande_moyenne' => $commandeMoyenne,
                    'statistiques_statut' => $statistiquesStatut,
                    'statistiques_paiement' => $statistiquesPaiement,
                    'evolution_commandes' => $evolutionCommandes,
                    'evolution_chiffre_affaires' => $evolutionCA
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour le statut d'une commande
     */
    public function mettreAJourStatutCommande(Request $request, $boutiqueId, $commandeId)
    {
        try {
            $request->validate([
                'statut' => 'required|in:en_attente,payee,en_cours,livree,annulee'
            ]);

            $boutique = Boutique::findOrFail($boutiqueId);
            
            if ($boutique->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette boutique'
                ], 403);
            }

            $commande = Commande::where('boutique_id', $boutiqueId)
                               ->findOrFail($commandeId);

            $ancienStatut = $commande->statut;
            $commande->statut = $request->statut;
            $commande->save();

            return response()->json([
                'success' => true,
                'message' => "Statut de la commande mis à jour de '{$ancienStatut}' vers '{$request->statut}'",
                'data' => [
                    'commande_id' => $commande->id,
                    'ancien_statut' => $ancienStatut,
                    'nouveau_statut' => $request->statut
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du statut: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exporter les commandes en CSV
     */
    public function exporterCommandesCSV(Request $request, $boutiqueId)
    {
        try {
            $boutique = Boutique::findOrFail($boutiqueId);
            
            if ($boutique->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette boutique'
                ], 403);
            }

            $query = Commande::with(['user', 'produits'])
                ->where('boutique_id', $boutiqueId);

            // Appliquer les mêmes filtres que pour la liste
            if ($request->filled('statut')) {
                $query->where('statut', $request->statut);
            }

            if ($request->filled('methode_paiement')) {
                $query->where('methode_paiement', $request->methode_paiement);
            }

            if ($request->filled('date_debut')) {
                $query->whereDate('created_at', '>=', $request->date_debut);
            }

            if ($request->filled('date_fin')) {
                $query->whereDate('created_at', '<=', $request->date_fin);
            }

            $commandes = $query->orderBy('created_at', 'desc')->get();

            // Générer le CSV
            $filename = "commandes_boutique_{$boutiqueId}_" . date('Y-m-d') . ".csv";
            $filepath = storage_path("app/exports/{$filename}");

            // Créer le dossier s'il n'existe pas
            if (!file_exists(dirname($filepath))) {
                mkdir(dirname($filepath), 0755, true);
            }

            $handle = fopen($filepath, 'w');
            
            // En-têtes CSV
            fputcsv($handle, [
                'Référence',
                'Client',
                'Email',
                'Téléphone',
                'Montant Total',
                'Statut',
                'Méthode Paiement',
                'Date Commande',
                'Produits',
                'Adresse Livraison'
            ]);

            // Données
            foreach ($commandes as $commande) {
                $produits = $commande->produits->map(function($p) {
                    return $p->nom . ' (x' . $p->pivot->quantite . ')';
                })->implode(', ');

                fputcsv($handle, [
                    $commande->reference,
                    $commande->user ? $commande->user->nom . ' ' . $commande->user->prenom : 'N/A',
                    $commande->user ? $commande->user->email : 'N/A',
                    $commande->user ? $commande->user->telephone : 'N/A',
                    $commande->montant_total,
                    $commande->statut,
                    $commande->methode_paiement,
                    $commande->created_at->format('Y-m-d H:i:s'),
                    $produits,
                    $commande->adresse_livraison ?: 'N/A'
                ]);
            }

            fclose($handle);

            // Retourner le fichier en téléchargement
            return response()->download($filepath)->deleteFileAfterSend();

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export CSV: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les détails d'une commande spécifique
     */
    public function obtenirDetailsCommande($boutiqueId, $commandeId)
    {
        try {
            $boutique = Boutique::findOrFail($boutiqueId);
            
            if ($boutique->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette boutique'
                ], 403);
            }

            $commande = Commande::with(['user', 'produits', 'paiement'])
                ->where('boutique_id', $boutiqueId)
                ->findOrFail($commandeId);

            $commandeData = [
                'id' => $commande->id,
                'reference' => $commande->reference,
                'montant_total' => $commande->montant_total,
                'frais_commission' => $commande->frais_commission,
                'statut' => $commande->statut,
                'methode_paiement' => $commande->methode_paiement,
                'transaction_id' => $commande->transaction_id,
                'adresse_livraison' => $commande->adresse_livraison,
                'notes' => $commande->notes,
                'created_at' => $commande->created_at,
                'updated_at' => $commande->updated_at,
                'user' => $commande->user ? [
                    'id' => $commande->user->id,
                    'nom' => $commande->user->nom,
                    'prenom' => $commande->user->prenom,
                    'email' => $commande->user->email,
                    'telephone' => $commande->user->telephone,
                    'localite' => $commande->user->localite,
                    'pays' => $commande->user->pays
                ] : null,
                'produits' => $commande->produits->map(function ($produit) {
                    return [
                        'id' => $produit->id,
                        'nom' => $produit->nom,
                        'description' => $produit->description,
                        'prix_unitaire' => $produit->pivot->prix_unitaire,
                        'quantite' => $produit->pivot->quantite,
                        'sous_total' => $produit->pivot->sous_total,
                        'image' => $produit->image
                    ];
                }),
                'paiement' => $commande->paiement ? [
                    'id' => $commande->paiement->id,
                    'montant' => $commande->paiement->montant,
                    'methode' => $commande->paiement->methode,
                    'reference' => $commande->paiement->reference,
                    'statut' => $commande->paiement->statut,
                    'details' => $commande->paiement->details,
                    'created_at' => $commande->paiement->created_at
                ] : null
            ];

            return response()->json([
                'success' => true,
                'message' => 'Détails de la commande récupérés avec succès',
                'data' => $commandeData
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des détails: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les clients de la boutique
     */
    public function obtenirClientsBoutique($boutiqueId)
    {
        try {
            $boutique = Boutique::findOrFail($boutiqueId);
            
            if ($boutique->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette boutique'
                ], 403);
            }

            $clients = DB::table('users')
                ->join('commandes', 'users.id', '=', 'commandes.user_id')
                ->where('commandes.boutique_id', $boutiqueId)
                ->select([
                    'users.id',
                    'users.nom',
                    'users.prenom',
                    'users.email',
                    'users.telephone',
                    'users.localite',
                    'users.pays',
                    DB::raw('COUNT(commandes.id) as total_commandes'),
                    DB::raw('SUM(commandes.montant_total) as montant_total'),
                    DB::raw('MAX(commandes.created_at) as derniere_commande'),
                    DB::raw('MIN(commandes.created_at) as premiere_commande')
                ])
                ->groupBy([
                    'users.id', 
                    'users.nom', 
                    'users.prenom', 
                    'users.email', 
                    'users.telephone', 
                    'users.localite', 
                    'users.pays'
                ])
                ->orderBy('montant_total', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Clients récupérés avec succès',
                'data' => $clients
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des clients: ' . $e->getMessage()
            ], 500);
        }
    }
}