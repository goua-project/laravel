<?php

namespace App\Http\Controllers\Api;

use App\Models\Commande;
use App\Models\CommandeProduit;
use App\Models\Paiement;
use App\Models\Produit;
use App\Models\Boutique;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use App\Http\Controllers\Controller;

class CommandeController extends Controller
{
    /**
     * Créer une nouvelle commande avec intégration KaliaPay
     */
    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            \Log::info('Début création commande', ['request_data' => $request->all()]);

            $validator = Validator::make($request->all(), [
                'boutique_id' => 'required|exists:boutiques,id',
                'produits' => 'required|array|min:1',
                'produits.*.id' => 'required|exists:produits,id',
                'produits.*.quantite' => 'required|integer|min:1',
                'methode_paiement' => 'required|in:en_ligne,a_la_livraison,kaliapay',
                'type_paiement_kalia' => 'required_if:methode_paiement,kaliapay|in:webpay,mobpay,eshoppay,flash',
                'provider_kalia' => 'required_if:type_paiement_kalia,flash|in:orangeci,waveci,mtnci,cards',
                'customer_phone' => 'required_if:type_paiement_kalia,flash|digits:10',
                'adresse_livraison' => 'required_if:methode_paiement,a_la_livraison|string',
                'notes' => 'nullable|string',
                'custom_data' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                \Log::warning('Validation failed', ['errors' => $validator->errors()]);
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth()->user();
            \Log::info('Utilisateur authentifié', ['user_id' => $user->id]);

            $boutique = Boutique::findOrFail($request->boutique_id);
            \Log::info('Boutique trouvée', ['boutique_id' => $boutique->id]);

            // Vérifier la cohérence des types de produits et méthode de paiement
            $this->validerTypesProduitsEtPaiement($request->produits, $request->methode_paiement);

            // Calculer le montant total et préparer les produits
            $montantTotal = 0;
            $produitsACommander = [];
            $contientProduitDigital = false;

            foreach ($request->produits as $index => $produitData) {
                $produit = Produit::findOrFail($produitData['id']);
                \Log::info('Produit trouvé', [
                    'index' => $index,
                    'produit_id' => $produit->id,
                    'type' => $produit->type,
                    'stock' => $produit->stock,
                    'quantite_demandee' => $produitData['quantite']
                ]);
                
                // Vérifier le stock pour les produits physiques
                if ($produit->type === 'physique' && $produit->stock < $produitData['quantite']) {
                    $message = "Stock insuffisant pour le produit: " . $produit->nom;
                    \Log::warning($message);
                    throw new \Exception($message);
                }

                $sousTotal = $produit->prix * $produitData['quantite'];
                $montantTotal += $sousTotal;

                if ($produit->type === 'digital') {
                    $contientProduitDigital = true;
                }

                $produitsACommander[] = [
                    'produit' => $produit,
                    'quantite' => $produitData['quantite'],
                    'prix_unitaire' => $produit->prix,
                    'sous_total' => $sousTotal
                ];
            }

            \Log::info('Calculs terminés', [
                'montant_total' => $montantTotal,
                'contient_produit_digital' => $contientProduitDigital,
                'nombre_produits' => count($produitsACommander)
            ]);

            // Forcer le paiement en ligne si la commande contient des produits digitaux
            if ($contientProduitDigital && $request->methode_paiement === 'a_la_livraison') {
                $message = 'Les produits digitaux nécessitent un paiement en ligne.';
                \Log::warning($message);
                throw new \Exception($message);
            }

            // Calculer les frais de commission (exemple: 5%)
            $fraisCommission = $montantTotal * 0.05;

            // Déterminer le statut initial - CORRECTION ICI
            $statutInitial = $request->methode_paiement === 'a_la_livraison' ? 'en_cours' : 'en_attente';
            \Log::info('Statut initial déterminé', [
                'methode_paiement' => $request->methode_paiement,
                'statut_initial' => $statutInitial
            ]);

            // Créer la commande
            $commandeData = [
                'user_id' => $user->id,
                'boutique_id' => $boutique->id,
                'reference' => 'CMD-' . Str::upper(Str::random(10)),
                'montant_total' => $montantTotal,
                'frais_commission' => $fraisCommission,
                'statut' => $statutInitial,
                'methode_paiement' => $request->methode_paiement,
                'adresse_livraison' => $request->adresse_livraison,
                'notes' => $request->notes
            ];

            \Log::info('Création commande', ['commande_data' => $commandeData]);
            $commande = Commande::create($commandeData);
            \Log::info('Commande créée', ['commande_id' => $commande->id, 'reference' => $commande->reference]);

            // Ajouter les produits à la commande
            foreach ($produitsACommander as $index => $produitData) {
                $commandeProduitData = [
                    'commande_id' => $commande->id,
                    'produit_id' => $produitData['produit']->id,
                    'quantite' => $produitData['quantite'],
                    'prix_unitaire' => $produitData['prix_unitaire'],
                    'sous_total' => $produitData['sous_total']
                ];

                \Log::info('Création commande_produit', [
                    'index' => $index,
                    'data' => $commandeProduitData
                ]);

                CommandeProduit::create($commandeProduitData);

                // Mettre à jour le stock seulement pour les produits physiques
                if ($produitData['produit']->type === 'physique') {
                    \Log::info('Mise à jour stock produit physique', [
                        'produit_id' => $produitData['produit']->id,
                        'ancien_stock' => $produitData['produit']->stock,
                        'quantite_retiree' => $produitData['quantite']
                    ]);
                    $produitData['produit']->decrement('stock', $produitData['quantite']);
                }
            }

            // Gérer le paiement selon la méthode
            $paiementData = null;
            if ($request->methode_paiement === 'kaliapay') {
                \Log::info('Création paiement KaliaPay');
                $paiementData = $this->creerPaiementKaliaPay($commande, $request);
            } elseif ($request->methode_paiement === 'en_ligne') {
                \Log::info('Création paiement en ligne');
                $paiementData = $this->creerPaiementEnLigne($commande);
            } else {
                \Log::info('Création paiement livraison');
                $paiementData = $this->creerPaiementLivraison($commande);
            }

            DB::commit();
            \Log::info('Commande créée avec succès', [
                'commande_id' => $commande->id,
                'reference' => $commande->reference
            ]);

            return response()->json([
                'success' => true,
                'commande' => $commande->fresh(['produits', 'boutique']),
                'paiement' => $paiementData,
                'message' => $this->getMessageConfirmation($request->methode_paiement)
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('ERREUR création commande', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la commande: ' . $e->getMessage(),
                'debug' => env('APP_DEBUG') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ] : null
            ], 500);
        }
    }

    /**
     * Créer un paiement KaliaPay selon le type
     */
    private function creerPaiementKaliaPay(Commande $commande, Request $request)
    {
        $baseUrl = 'https://kaliapay.com';
        $apiKey = config('services.kaliapay.api_key');
        $serviceId = config('services.kaliapay.service_id');
        $typePaiement = $request->type_paiement_kalia;
        $customData = $request->custom_data ?? 'commande_' . $commande->id;

        \Log::info('Initialisation KaliaPay', [
            'type_paiement' => $typePaiement,
            'commande_id' => $commande->id,
            'montant' => $commande->montant_total
        ]);

        try {
            switch ($typePaiement) {
                case 'webpay':
                    return $this->initierWebPayRedirect($commande, $apiKey, $serviceId, $baseUrl, $customData);
                
                case 'flash':
                    return $this->initierFlashPay($commande, $request, $apiKey, $serviceId, $baseUrl, $customData);
                
                case 'mobpay':
                    return $this->initierMobPay($commande, $apiKey, $serviceId, $baseUrl, $customData);
                
                case 'eshoppay':
                    return $this->initierEshopPay($commande, $apiKey, $serviceId, $baseUrl, $customData);
                
                default:
                    $message = 'Type de paiement KaliaPay non supporté: ' . $typePaiement;
                    \Log::error($message);
                    throw new \Exception($message);
            }
        } catch (\Exception $e) {
            \Log::error('Erreur initialisation KaliaPay', [
                'message' => $e->getMessage(),
                'type_paiement' => $typePaiement
            ]);
            throw new \Exception('Erreur lors de l\'initialisation du paiement KaliaPay: ' . $e->getMessage());
        }
    }
    /**
     * Initialiser un paiement WebPay (redirection)
     */
    private function initierWebPayRedirect($commande, $apiKey, $serviceId, $baseUrl, $customData)
    {
        $response = Http::asForm()->post($baseUrl . '/request-payment-channels/', [
            'apikey' => $apiKey,
            'service' => $serviceId,
            'amount' => (int) $commande->montant_total,
            'custom_data' => $customData
        ]);

        if (!$response->successful()) {
            throw new \Exception('Erreur KaliaPay WebPay: ' . $response->body());
        }

        $paiement = Paiement::create([
            'commande_id' => $commande->id,
            'montant' => $commande->montant_total,
            'methode' => 'kaliapay_webpay',
            'reference' => 'KLP-' . Str::upper(Str::random(10)),
            'statut' => 'initie',
            'details' => json_encode([
                'type' => 'webpay_redirect',
                'custom_data' => $customData,
                'redirect_url' => $baseUrl . $response->headers()->get('Location'),
                'date_initiation' => now()->toDateTimeString()
            ])
        ]);

        return [
            'type' => 'webpay_redirect',
            'redirect_url' => $baseUrl . $response->headers()->get('Location'),
            'reference' => $paiement->reference
        ];
    }

    /**
     * Initialiser un paiement Flash
     */
    private function initierFlashPay($commande, $request, $apiKey, $serviceId, $baseUrl, $customData)
    {
        $url = sprintf(
            '%s/flash/%s/%d/%s/%s/%s/?provider=%s&customer=%s',
            $baseUrl,
            $apiKey,
            (int) $commande->montant_total,
            $serviceId,
            urlencode($request->extra_data ?? ''),
            urlencode($customData),
            $request->provider_kalia,
            $request->customer_phone
        );

        $paiement = Paiement::create([
            'commande_id' => $commande->id,
            'montant' => $commande->montant_total,
            'methode' => 'kaliapay_flash',
            'reference' => 'KLP-' . Str::upper(Str::random(10)),
            'statut' => 'initie',
            'details' => json_encode([
                'type' => 'webpay_flash',
                'provider' => $request->provider_kalia,
                'customer_phone' => $request->customer_phone,
                'custom_data' => $customData,
                'payment_url' => $url
            ])
        ]);

        return [
            'type' => 'flash_pay',
            'payment_url' => $url,
            'reference' => $paiement->reference,
            'provider' => $request->provider_kalia
        ];
    }

    /**
     * Initialiser un paiement MobPay (QR Code)
     */
    private function initierMobPay($commande, $apiKey, $serviceId, $baseUrl, $customData)
    {
        // Authentification
        $authToken = $this->authenticateKaliaPay($baseUrl);

        $response = Http::withHeaders([
            'Authorization' => 'Token ' . $authToken
        ])->asForm()->post($baseUrl . '/api/generate-mobpay-qrcode/', [
            'apikey' => $apiKey,
            'service' => $serviceId,
            'amount' => (int) $commande->montant_total,
            'custom_data' => $customData
        ]);

        if (!$response->successful() || $response->json('state') !== 'success') {
            throw new \Exception('Erreur KaliaPay MobPay: ' . $response->json('message'));
        }

        $result = $response->json('result');

        $paiement = Paiement::create([
            'commande_id' => $commande->id,
            'montant' => $commande->montant_total,
            'methode' => 'kaliapay_mobpay',
            'reference' => $result['reference'],
            'statut' => 'initie',
            'details' => json_encode([
                'type' => 'mobpay',
                'custom_data' => $customData,
                'qrcode_url' => $result['qrcode_url'],
                'qrcode_image' => $result['qrcode_image'],
                'shortened_url' => $result['shortened_url'],
                'reference_kalia' => $result['reference']
            ])
        ]);

        return [
            'type' => 'mobpay_qr',
            'qrcode_url' => $result['qrcode_url'],
            'qrcode_image' => $result['qrcode_image'],
            'shortened_url' => $result['shortened_url'],
            'reference' => $paiement->reference,
            'reference_kalia' => $result['reference']
        ];
    }

    /**
     * Initialiser un paiement eShopPay (QR Code)
     */
    private function initierEshopPay($commande, $apiKey, $serviceId, $baseUrl, $customData)
    {
        $authToken = $this->authenticateKaliaPay($baseUrl);

        $response = Http::withHeaders([
            'Authorization' => 'Token ' . $authToken
        ])->asForm()->post($baseUrl . '/api/generate-webpay-qrcode/', [
            'apikey' => $apiKey,
            'service' => $serviceId,
            'amount' => (int) $commande->montant_total,
            'custom_data' => $customData
        ]);

        if (!$response->successful() || $response->json('state') !== 'success') {
            throw new \Exception('Erreur KaliaPay eShopPay: ' . $response->json('message'));
        }

        $result = $response->json('result');

        $paiement = Paiement::create([
            'commande_id' => $commande->id,
            'montant' => $commande->montant_total,
            'methode' => 'kaliapay_eshoppay',
            'reference' => $result['reference'],
            'statut' => 'initie',
            'details' => json_encode([
                'type' => 'eshoppay',
                'custom_data' => $customData,
                'qrcode_url' => $result['qrcode_url'],
                'qrcode_image' => $result['qrcode_image'],
                'shortened_url' => $result['shortened_url'],
                'reference_kalia' => $result['reference']
            ])
        ]);

        return [
            'type' => 'eshoppay_qr',
            'qrcode_url' => $result['qrcode_url'],
            'qrcode_image' => $result['qrcode_image'],
            'shortened_url' => $result['shortened_url'],
            'reference' => $paiement->reference,
            'reference_kalia' => $result['reference']
        ];
    }

    /**
     * Authentification auprès de KaliaPay
     */
    private function authenticateKaliaPay($baseUrl)
    {
        $response = Http::asForm()->post($baseUrl . '/api/signin-users/', [
            'user' => config('services.kaliapay.username'),
            'password' => config('services.kaliapay.password')
        ]);

        if (!$response->successful() || $response->json('state') !== 'success') {
            throw new \Exception('Échec de l\'authentification KaliaPay');
        }

        return $response->json('result.tid');
    }

    /**
     * Valider la cohérence entre types de produits et méthode de paiement
     */
    private function validerTypesProduitsEtPaiement(array $produits, string $methodePaiement)
    {
        $produitIds = array_column($produits, 'id');
        $produits = Produit::whereIn('id', $produitIds)->get();

        \Log::info('Validation types produits', [
            'nombre_produits' => count($produits),
            'methode_paiement' => $methodePaiement
        ]);

        foreach ($produits as $produit) {
            if ($produit->type === 'digital' && $methodePaiement === 'a_la_livraison') {
                $message = "Le produit digital '{$produit->nom}' ne peut pas être payé à la livraison.";
                \Log::warning($message);
                throw new \Exception($message);
            }
            
            if ($produit->type === 'service' && $methodePaiement === 'a_la_livraison') {
                $message = "Le service '{$produit->nom}' ne peut pas être payé à la livraison.";
                \Log::warning($message);
                throw new \Exception($message);
            }
        }
    }

    /**
     * Créer un paiement en ligne standard
     */
    private function creerPaiementEnLigne(Commande $commande)
    {
        $paiement = Paiement::create([
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

        return [
            'type' => 'standard_online',
            'url_paiement' => $this->genererUrlPaiement($commande),
            'reference' => $paiement->reference
        ];
    }

    /**
     * Créer un paiement à la livraison
     */
    private function creerPaiementLivraison(Commande $commande)
    {
        $paiement = Paiement::create([
            'commande_id' => $commande->id,
            'montant' => $commande->montant_total,
            'methode' => 'especes_livraison',
            'reference' => 'PAY-' . Str::upper(Str::random(10)),
            'statut' => 'en_attente',
            'details' => json_encode([
                'type' => 'a_la_livraison',
                'a_payer_livraison' => true,
                'montant_a_payer' => $commande->montant_total
            ])
        ]);

        return [
            'type' => 'cash_on_delivery',
            'montant_a_payer' => $commande->montant_total,
            'reference' => $paiement->reference
        ];
    }

    /**
     * Générer l'URL de paiement standard
     */
    private function genererUrlPaiement(Commande $commande)
    {
        return url('/payment/' . $commande->reference);
    }

    /**
     * Obtenir le message de confirmation selon la méthode
     */
    private function getMessageConfirmation($methodePaiement)
    {
        switch ($methodePaiement) {
            case 'kaliapay':
                return 'Commande créée. Procédez au paiement via KaliaPay.';
            case 'en_ligne':
                return 'Commande créée. Veuillez procéder au paiement en ligne.';
            case 'a_la_livraison':
                return 'Commande créée avec paiement à la livraison.';
            default:
                return 'Commande créée avec succès.';
        }
    }

    /**
     * Callback de succès pour les paiements KaliaPay
     */
    public function callbackKaliaPaySuccess(Request $request)
    {
        DB::beginTransaction();

        try {
            \Log::info('Callback KaliaPay succès reçu:', $request->all());

            $validator = Validator::make($request->all(), [
                'reference' => 'required|string',
                'txn_status' => 'required|string',
                'amount' => 'required|numeric',
                'custom_data' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // Extraire l'ID de commande du custom_data
            $customData = $request->custom_data ?? $request->extra_data ?? '';
            $commandeId = null;

            if (strpos($customData, 'commande_') === 0) {
                $commandeId = (int) str_replace('commande_', '', $customData);
            }

            if (!$commandeId) {
                throw new \Exception('ID de commande non trouvé dans les données callback');
            }

            $commande = Commande::findOrFail($commandeId);
            $paiement = Paiement::where('commande_id', $commande->id)
                ->whereIn('methode', ['kaliapay_webpay', 'kaliapay_flash', 'kaliapay_mobpay', 'kaliapay_eshoppay'])
                ->first();

            if (!$paiement) {
                throw new \Exception('Paiement KaliaPay non trouvé pour cette commande');
            }

            // Vérifier si le paiement a réussi
            if (in_array(strtolower($request->txn_status), ['success', 'successful'])) {
                // Mettre à jour le paiement
                $paiement->update([
                    'statut' => 'paye',
                    'details' => json_encode(array_merge(
                        json_decode($paiement->details, true),
                        $request->all(),
                        ['date_paiement' => now()->toDateTimeString()]
                    ))
                ]);

                // Mettre à jour la commande
                $commande->update([
                    'statut' => 'payee',
                    'transaction_id' => $request->txn_id ?? $request->reference
                ]);

                // Traiter les produits digitaux
                $this->traiterProduitsDigitaux($commande);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Paiement KaliaPay confirmé avec succès',
                    'commande' => $commande->fresh(['produits', 'paiement']),
                    'liens_telechargement' => $this->getLiensTelechargement($commande)
                ]);
            } else {
                throw new \Exception('Statut de paiement non réussi: ' . $request->txn_status);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur callback KaliaPay: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du traitement du callback: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vérifier le statut d'un paiement KaliaPay
     */
    public function verifierStatutPaiementKalia($commandeId)
    {
        try {
            $user = auth()->user();
            $commande = Commande::where('user_id', $user->id)->findOrFail($commandeId);
            $paiement = $commande->paiement;

            if (!$paiement || !str_contains($paiement->methode, 'kaliapay')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Paiement KaliaPay non trouvé'
                ], 404);
            }

            $details = json_decode($paiement->details, true);
            $referenceKalia = $details['reference_kalia'] ?? null;

            if (!$referenceKalia) {
                return response()->json([
                    'success' => false,
                    'message' => 'Référence KaliaPay non trouvée'
                ], 400);
            }

            // Vérifier le statut auprès de KaliaPay
            $baseUrl = 'https://kaliapay.com';
            $authToken = $this->authenticateKaliaPay($baseUrl);

            $response = Http::withHeaders([
                'Authorization' => 'Token ' . $authToken
            ])->get($baseUrl . '/api/get-express-transaction-details/' . $referenceKalia . '/');

            if ($response->successful() && $response->json('state') === 'success') {
                $result = $response->json('result');
                
                return response()->json([
                    'success' => true,
                    'statut' => $result['status'],
                    'details' => $result,
                    'commande' => $commande
                ]);
            } else {
                throw new \Exception('Erreur lors de la vérification: ' . $response->json('message'));
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Traiter le callback de paiement réussi (méthode existante mise à jour)
     */
    public function callbackPaiementSuccess(Request $request, $reference)
    {
        DB::beginTransaction();

        try {
            $paiement = Paiement::where('reference', $reference)->firstOrFail();
            $commande = $paiement->commande;

            // Valider les données du callback
            $validator = Validator::make($request->all(), [
                'transaction_id' => 'required|string',
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
                'statut' => 'paye',
                'details' => json_encode(array_merge(
                    json_decode($paiement->details, true),
                    $request->details ?? [],
                    ['date_paiement' => now()->toDateTimeString()]
                ))
            ]);

            // Mettre à jour la commande
            $commande->update([
                'statut' => 'payee',
                'transaction_id' => $request->transaction_id
            ]);

            // Traiter les produits digitaux
            $this->traiterProduitsDigitaux($commande);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Paiement confirmé avec succès',
                'commande' => $commande->fresh(['produits', 'paiement']),
                'liens_telechargement' => $this->getLiensTelechargement($commande)
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
     * Traiter les produits digitaux après paiement
     */
    private function traiterProduitsDigitaux(Commande $commande)
    {
        $produitsDigitaux = $commande->produits->where('type', 'digital');
        
        foreach ($produitsDigitaux as $produit) {
            // Ici vous pouvez :
            // 1. Envoyer un email avec le lien de téléchargement
            // 2. Générer un token d'accès temporaire
            // 3. Logger la distribution du produit digital
            
            \Log::info('Produit digital traité: ' . $produit->nom . ' pour la commande: ' . $commande->reference);
        }
    }

    /**
     * Obtenir les liens de téléchargement pour les produits digitaux
     */
    private function getLiensTelechargement(Commande $commande)
    {
        $liens = [];
        $produitsDigitaux = $commande->produits->where('type', 'digital');
        
        foreach ($produitsDigitaux as $produit) {
            if ($produit->lien_telechargement) {
                $liens[] = [
                    'produit_id' => $produit->id,
                    'produit_nom' => $produit->nom,
                    'lien_telechargement' => $produit->lien_telechargement,
                    'token_acces' => Str::random(32),
                    'expire_le' => now()->addDays(30)->toDateTimeString()
                ];
            }
        }

        return $liens;
    }

    /**
     * Traiter l'échec de paiement
     */
    public function callbackPaiementEchec(Request $request, $reference)
    {
        DB::beginTransaction();

        try {
            $paiement = Paiement::where('reference', $reference)->firstOrFail();
            $commande = $paiement->commande;

            $paiement->update([
                'statut' => 'echec',
                'details' => json_encode(array_merge(
                    json_decode($paiement->details, true),
                    $request->details ?? [],
                    ['date_echec' => now()->toDateTimeString()]
                ))
            ]);

            $commande->update(['statut' => 'annulee']);

            // Restaurer le stock seulement pour les produits physiques
            $this->restaurerStockPhysique($commande);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Paiement échoué - Commande annulée',
                'commande' => $commande->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du traitement de l\'échec: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurer le stock des produits physiques seulement
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

        // Ajouter les liens de téléchargement si la commande est payée et contient des digitaux
        $liensTelechargement = [];
        if ($commande->statut === 'payee') {
            $liensTelechargement = $this->getLiensTelechargement($commande);
        }

        // Ajouter les informations de paiement KaliaPay si applicable
        $infoPaiementKalia = null;
        if ($commande->paiement && str_contains($commande->paiement->methode, 'kaliapay')) {
            $details = json_decode($commande->paiement->details, true);
            $infoPaiementKalia = [
                'type' => $details['type'] ?? null,
                'reference_kalia' => $details['reference_kalia'] ?? null,
                'qrcode_url' => $details['qrcode_url'] ?? null,
                'payment_url' => $details['payment_url'] ?? null,
                'provider' => $details['provider'] ?? null
            ];
        }

        return response()->json([
            'success' => true,
            'commande' => $commande,
            'liens_telechargement' => $liensTelechargement,
            'info_paiement_kalia' => $infoPaiementKalia
        ]);
    }

    /**
     * Annuler une commande
     */
      /**
     * Annuler une commande
     */
    public function annuler($id)
    {
        DB::beginTransaction();

        try {
            $user = auth()->user();
            \Log::info('Tentative annulation commande', ['commande_id' => $id, 'user_id' => $user->id]);

            $commande = Commande::where('user_id', $user->id)->findOrFail($id);
            \Log::info('Commande trouvée pour annulation', [
                'commande_id' => $commande->id,
                'statut_actuel' => $commande->statut
            ]);

            // Vérifier si la commande peut être annulée - CORRECTION ICI
            if (!in_array($commande->statut, ['en_attente', 'en_cours'])) {
                $message = 'Impossible d\'annuler cette commande dans son état actuel: ' . $commande->statut;
                \Log::warning($message);
                throw new \Exception($message);
            }

            // Annuler le paiement si existant
            if ($commande->paiement) {
                \Log::info('Annulation paiement', ['paiement_id' => $commande->paiement->id]);
                $commande->paiement->update(['statut' => 'annule']);
            }

            // Mettre à jour le statut de la commande
            $commande->update(['statut' => 'annulee']);
            \Log::info('Statut commande mis à jour', ['nouveau_statut' => 'annulee']);

            // Restaurer le stock seulement pour les produits physiques
            $this->restaurerStockPhysique($commande);

            DB::commit();
            \Log::info('Commande annulée avec succès', ['commande_id' => $commande->id]);

            return response()->json([
                'success' => true,
                'message' => 'Commande annulée avec succès',
                'commande' => $commande->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur annulation commande', [
                'commande_id' => $id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Relancer un paiement KaliaPay échoué
     */
       /**
     * Relancer un paiement KaliaPay échoué
     */
    public function relancerPaiementKalia($commandeId, Request $request)
    {
        DB::beginTransaction();

        try {
            \Log::info('Relance paiement KaliaPay', [
                'commande_id' => $commandeId,
                'request_data' => $request->all()
            ]);

            $validator = Validator::make($request->all(), [
                'type_paiement_kalia' => 'required|in:webpay,mobpay,eshoppay,flash',
                'provider_kalia' => 'required_if:type_paiement_kalia,flash|in:orangeci,waveci,mtnci,cards',
                'customer_phone' => 'required_if:type_paiement_kalia,flash|digits:10',
                'custom_data' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                \Log::warning('Validation relance paiement failed', ['errors' => $validator->errors()]);
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth()->user();
            $commande = Commande::where('user_id', $user->id)->findOrFail($commandeId);

            // Vérifier que la commande peut être relancée
            if (!in_array($commande->statut, ['en_attente', 'annulee'])) {
                $message = 'Impossible de relancer le paiement pour cette commande. Statut: ' . $commande->statut;
                \Log::warning($message);
                throw new \Exception($message);
            }

            // Marquer l'ancien paiement comme annulé si existant
            if ($commande->paiement) {
                \Log::info('Annulation ancien paiement', ['paiement_id' => $commande->paiement->id]);
                $commande->paiement->update(['statut' => 'annule']);
            }

            // Créer un nouveau paiement KaliaPay
            $paiementData = $this->creerPaiementKaliaPay($commande, $request);

            // Mettre à jour le statut de la commande
            $commande->update(['statut' => 'en_attente']);
            \Log::info('Statut commande mis à jour pour relance', ['nouveau_statut' => 'en_attente']);

            DB::commit();
            \Log::info('Paiement relancé avec succès', ['commande_id' => $commande->id]);

            return response()->json([
                'success' => true,
                'message' => 'Nouveau paiement KaliaPay initialisé',
                'commande' => $commande->fresh(['produits', 'boutique', 'paiement']),
                'paiement' => $paiementData
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur relance paiement', [
                'commande_id' => $commandeId,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la relance du paiement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques des commandes pour un utilisateur
     */
    public function statistiques()
    {
        $user = auth()->user();
        
        $stats = [
            'total_commandes' => Commande::where('user_id', $user->id)->count(),
            'commandes_payees' => Commande::where('user_id', $user->id)->where('statut', 'payee')->count(),
            'commandes_en_attente' => Commande::where('user_id', $user->id)->where('statut', 'en_attente')->count(),
            'commandes_annulees' => Commande::where('user_id', $user->id)->where('statut', 'annulee')->count(),
            'montant_total_depense' => Commande::where('user_id', $user->id)
                ->where('statut', 'payee')
                ->sum('montant_total'),
            'commandes_kaliapay' => Commande::where('user_id', $user->id)
                ->where('methode_paiement', 'kaliapay')
                ->count(),
            'derniere_commande' => Commande::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->first(['id', 'reference', 'montant_total', 'statut', 'created_at'])
        ];

        return response()->json([
            'success' => true,
            'statistiques' => $stats
        ]);
    }

    /**
     * Webhook générique pour les callbacks KaliaPay
     */
    public function webhookKaliaPay(Request $request)
    {
        \Log::info('Webhook KaliaPay reçu:', $request->all());

        $validator = Validator::make($request->all(), [
            'txn_status' => 'required|string',
            'amount' => 'required|numeric',
            'reference' => 'nullable|string',
            'custom_data' => 'nullable|string',
            'extra_data' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            \Log::error('Webhook KaliaPay invalide:', $validator->errors()->toArray());
            return response('Invalid webhook data', 400);
        }

        // Vérifier l'authenticité du webhook (si signature fournie)
        if ($request->has('signature')) {
            $expectedSignature = hash_hmac('sha256', json_encode($request->except('signature')), config('services.kaliapay.webhook_secret'));
            if (!hash_equals($expectedSignature, $request->signature)) {
                \Log::error('Signature webhook KaliaPay invalide');
                return response('Invalid signature', 401);
            }
        }

        DB::beginTransaction();

        try {
            // Extraire l'ID de commande
            $customData = $request->custom_data ?? $request->extra_data ?? '';
            $commandeId = null;

            if (strpos($customData, 'commande_') === 0) {
                $commandeId = (int) str_replace('commande_', '', $customData);
            }

            if (!$commandeId) {
                \Log::warning('ID de commande non trouvé dans le webhook KaliaPay');
                return response('Commande ID not found', 400);
            }

            $commande = Commande::find($commandeId);
            if (!$commande) {
                \Log::warning('Commande non trouvée: ' . $commandeId);
                return response('Commande not found', 404);
            }

            $paiement = $commande->paiement;
            if (!$paiement) {
                \Log::warning('Paiement non trouvé pour la commande: ' . $commandeId);
                return response('Paiement not found', 404);
            }

            // Traiter selon le statut
            switch (strtolower($request->txn_status)) {
                case 'success':
                case 'successful':
                    $this->traiterPaiementReussi($commande, $paiement, $request->all());
                    break;
                    
                case 'failed':
                case 'failure':
                    $this->traiterPaiementEchoue($commande, $paiement, $request->all());
                    break;
                    
                case 'pending':
                    $this->traiterPaiementEnAttente($commande, $paiement, $request->all());
                    break;
                    
                default:
                    \Log::info('Statut de paiement non géré: ' . $request->txn_status);
            }

            DB::commit();
            return response('OK', 200);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur traitement webhook KaliaPay: ' . $e->getMessage());
            return response('Internal server error', 500);
        }
    }

    /**
     * Traiter un paiement réussi
     */
    private function traiterPaiementReussi(Commande $commande, Paiement $paiement, array $webhookData)
    {
        $paiement->update([
            'statut' => 'paye',
            'details' => json_encode(array_merge(
                json_decode($paiement->details, true) ?? [],
                $webhookData,
                ['date_paiement' => now()->toDateTimeString()]
            ))
        ]);

        $commande->update([
            'statut' => 'payee',
            'transaction_id' => $webhookData['txn_id'] ?? $webhookData['reference'] ?? null
        ]);

        $this->traiterProduitsDigitaux($commande);
        
        \Log::info('Paiement KaliaPay réussi pour la commande: ' . $commande->reference);
    }

    /**
     * Traiter un paiement échoué
     */
    private function traiterPaiementEchoue(Commande $commande, Paiement $paiement, array $webhookData)
    {
        $paiement->update([
            'statut' => 'echec',
            'details' => json_encode(array_merge(
                json_decode($paiement->details, true) ?? [],
                $webhookData,
                ['date_echec' => now()->toDateTimeString()]
            ))
        ]);

        $commande->update(['statut' => 'annulee']);
        $this->restaurerStockPhysique($commande);
        
        \Log::info('Paiement KaliaPay échoué pour la commande: ' . $commande->reference);
    }

    /**
     * Traiter un paiement en attente
     */
    private function traiterPaiementEnAttente(Commande $commande, Paiement $paiement, array $webhookData)
    {
        $paiement->update([
            'statut' => 'en_attente',
            'details' => json_encode(array_merge(
                json_decode($paiement->details, true) ?? [],
                $webhookData,
                ['derniere_mise_a_jour' => now()->toDateTimeString()]
            ))
        ]);
        
        \Log::info('Paiement KaliaPay en attente pour la commande: ' . $commande->reference);
    }

    
}