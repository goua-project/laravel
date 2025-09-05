<?php

namespace App\Http\Controllers\Api;

use App\Models\Commande;
use App\Models\CommandeProduit;
use App\Models\Paiement;
use App\Models\Produit;
use App\Models\Boutique;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;

class AdminCommandeController extends Controller
{
    /**
     * Lister toutes les commandes avec pagination
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 15);
            $status = $request->get('status');
            $search = $request->get('search');

            $query = Commande::with([
                'user:id,nom,prenom,email,telephone',
                'boutique:id,nom',
                'produits',
                'paiement'
            ])
            ->orderBy('created_at', 'desc');

            // Filtrer par statut
            if ($status && $status !== 'all') {
                $query->where('statut', $status);
            }

            // Recherche
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('reference', 'like', "%{$search}%")
                      ->orWhereHas('user', function($q) use ($search) {
                          $q->where('nom', 'like', "%{$search}%")
                            ->orWhere('prenom', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                      })
                      ->orWhereHas('boutique', function($q) use ($search) {
                          $q->where('nom', 'like', "%{$search}%");
                      });
                });
            }

            $commandes = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $commandes->items(),
                'current_page' => $commandes->currentPage(),
                'last_page' => $commandes->lastPage(),
                'per_page' => $commandes->perPage(),
                'total' => $commandes->total()
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur liste commandes admin: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des commandes'
            ], 500);
        }
    }

    /**
     * Afficher une commande spécifique
     */
    public function show($id)
    {
        try {
            $commande = Commande::with([
                'user:id,nom,prenom,email,telephone',
                'boutique:id,nom,adresse,telephone',
                'produits',
                'paiement'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'commande' => $commande
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur détail commande admin: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Commande non trouvée'
            ], 404);
        }
    }

    /**
     * Mettre à jour le statut d'une commande
     */
    public function updateStatus(Request $request, $id)
    {
        DB::beginTransaction();

        try {
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
            $ancienStatut = $commande->statut;
            $nouveauStatut = $request->statut;

            // Validation des transitions de statut
            if (!$this->estTransitionValide($ancienStatut, $nouveauStatut)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transition de statut non autorisée'
                ], 422);
            }

            $commande->statut = $nouveauStatut;
            $commande->save();

            // Log de la modification
            Log::info('Statut commande modifié', [
                'commande_id' => $commande->id,
                'reference' => $commande->reference,
                'ancien_statut' => $ancienStatut,
                'nouveau_statut' => $nouveauStatut,
                'modifie_par' => auth()->id()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Statut de la commande mis à jour',
                'commande' => $commande->fresh(['user', 'boutique', 'produits'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur mise à jour statut commande: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du statut'
            ], 500);
        }
    }

    /**
     * Annuler une commande (pour admin)
     */
    public function annuler($id)
    {
        DB::beginTransaction();

        try {
            $commande = Commande::findOrFail($id);

            // Vérifier si la commande peut être annulée
            if (!in_array($commande->statut, ['en_attente', 'en_cours'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible d\'annuler cette commande dans son état actuel'
                ], 422);
            }

            // Annuler le paiement si existant
            if ($commande->paiement) {
                $commande->paiement->update(['statut' => 'annule']);
            }

            // Mettre à jour le statut de la commande
            $commande->statut = 'annulee';
            $commande->save();

            // Restaurer le stock des produits physiques
            $this->restaurerStockPhysique($commande);

            // Log de l'annulation
            Log::info('Commande annulée par admin', [
                'commande_id' => $commande->id,
                'reference' => $commande->reference,
                'annule_par' => auth()->id()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Commande annulée avec succès',
                'commande' => $commande->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur annulation commande admin: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation de la commande'
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques des commandes
     */
    public function statistiques()
    {
        try {
            $stats = [
                'total_commandes' => Commande::count(),
                'commandes_en_attente' => Commande::where('statut', 'en_attente')->count(),
                'commandes_payees' => Commande::where('statut', 'payee')->count(),
                'commandes_en_cours' => Commande::where('statut', 'en_cours')->count(),
                'commandes_livrees' => Commande::where('statut', 'livree')->count(),
                'commandes_annulees' => Commande::where('statut', 'annulee')->count(),
                'chiffre_affaires_total' => Commande::whereIn('statut', ['payee', 'livree'])->sum('montant_total'),
                'chiffre_affaires_mois' => Commande::whereIn('statut', ['payee', 'livree'])
                    ->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->sum('montant_total'),
                'frais_commission_total' => Commande::whereIn('statut', ['payee', 'livree'])->sum('frais_commission'),
                'commandes_par_methode_paiement' => Commande::select('methode_paiement', DB::raw('count(*) as total'))
                    ->groupBy('methode_paiement')
                    ->get()
            ];

            return response()->json([
                'success' => true,
                'statistiques' => $stats
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur statistiques commandes: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des statistiques'
            ], 500);
        }
    }

    /**
     * Exporter les commandes
     */
    public function exporter(Request $request)
    {
        try {
            $format = $request->get('format', 'json');
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');
            $status = $request->get('status');

            $query = Commande::with(['user', 'boutique', 'produits', 'paiement'])
                ->orderBy('created_at', 'desc');

            // Filtres
            if ($startDate) {
                $query->whereDate('created_at', '>=', $startDate);
            }
            if ($endDate) {
                $query->whereDate('created_at', '<=', $endDate);
            }
            if ($status && $status !== 'all') {
                $query->where('statut', $status);
            }

            $commandes = $query->get();

            if ($format === 'csv') {
                return $this->genererCSV($commandes);
            }

            // Format JSON par défaut
            return response()->json([
                'success' => true,
                'export_date' => now()->toDateTimeString(),
                'total_commandes' => $commandes->count(),
                'commandes' => $commandes
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur export commandes: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export des commandes'
            ], 500);
        }
    }

    /**
     * Vérifier la validité d'une transition de statut
     */
    private function estTransitionValide($ancienStatut, $nouveauStatut)
    {
        $transitionsValides = [
            'en_attente' => ['payee', 'annulee'],
            'payee' => ['en_cours', 'annulee'],
            'en_cours' => ['livree', 'annulee'],
            'livree' => [],
            'annulee' => []
        ];

        return in_array($nouveauStatut, $transitionsValides[$ancienStatut] ?? []);
    }

    /**
     * Restaurer le stock des produits physiques
     */
    private function restaurerStockPhysique(Commande $commande)
    {
        foreach ($commande->produits as $produit) {
            if ($produit->type === 'physique') {
                $produit->increment('stock', $produit->pivot->quantite);
            }
        }
    }

    /**
     * Générer un export CSV
     */
    private function genererCSV($commandes)
    {
        $fileName = 'commandes_' . date('Y-m-d_H-i-s') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ];

        $callback = function() use ($commandes) {
            $file = fopen('php://output', 'w');
            
            // En-têtes CSV
            fputcsv($file, [
                'Référence',
                'Date',
                'Client',
                'Email',
                'Boutique',
                'Produits',
                'Quantité totale',
                'Montant total',
                'Frais commission',
                'Méthode paiement',
                'Statut',
                'Adresse livraison'
            ]);

            // Données
            foreach ($commandes as $commande) {
                $produits = $commande->produits->map(function($produit) {
                    return $produit->nom . ' (' . $produit->pivot->quantite . 'x)';
                })->implode(', ');

                $quantiteTotale = $commande->produits->sum('pivot.quantite');

                fputcsv($file, [
                    $commande->reference,
                    $commande->created_at->format('d/m/Y H:i'),
                    $commande->user->prenom . ' ' . $commande->user->nom,
                    $commande->user->email,
                    $commande->boutique->nom,
                    $produits,
                    $quantiteTotale,
                    $commande->montant_total,
                    $commande->frais_commission,
                    $commande->methode_paiement,
                    $commande->statut,
                    $commande->adresse_livraison
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Rechercher des commandes
     */
    public function search(Request $request)
    {
        try {
            $searchTerm = $request->get('q');
            $limit = $request->get('limit', 10);

            if (!$searchTerm) {
                return response()->json([
                    'success' => true,
                    'commandes' => []
                ]);
            }

            $commandes = Commande::with(['user', 'boutique'])
                ->where('reference', 'like', "%{$searchTerm}%")
                ->orWhereHas('user', function($query) use ($searchTerm) {
                    $query->where('nom', 'like', "%{$searchTerm}%")
                          ->orWhere('prenom', 'like', "%{$searchTerm}%")
                          ->orWhere('email', 'like', "%{$searchTerm}%");
                })
                ->orWhereHas('boutique', function($query) use ($searchTerm) {
                    $query->where('nom', 'like', "%{$searchTerm}%");
                })
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();

            return response()->json([
                'success' => true,
                'commandes' => $commandes
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur recherche commandes: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche'
            ], 500);
        }
    }
}