<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Commande extends Model
{
    use HasFactory;

    /**
     * Les attributs qui sont mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'boutique_id',
        'reference',
        'montant_total',
        'frais_commission',
        'statut',
        'methode_paiement',
        'adresse_livraison',
        'notes',
        'type_paiement_kalia',
        'provider_kalia',
        'customer_phone',
        'transaction_id',
        'custom_data'
    ];

    /**
     * Les attributs qui doivent être castés.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'montant_total' => 'decimal:2',
        'frais_commission' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Les statuts possibles d'une commande.
     */
    const STATUTS = [
        'en_attente' => 'En attente de paiement',
        'confirmee' => 'Confirmée',
        'payee' => 'Payée',
        'en_cours' => 'En cours de traitement',
        'expediee' => 'Expédiée',
        'livree' => 'Livrée',
        'annulee' => 'Annulée',
        'rembourse' => 'Remboursée',
    ];

    /**
     * Les méthodes de paiement possibles.
     */
    const METHODES_PAIEMENT = [
        'en_ligne' => 'Paiement en ligne',
        'a_la_livraison' => 'Paiement à la livraison',
        'kaliapay' => 'KaliaPay',
    ];

    /**
     * Les types de paiement KaliaPay possibles.
     */
    const TYPES_KALIAPAY = [
        'webpay' => 'WebPay (Redirection)',
        'flash' => 'Flash Pay (Direct)',
        'mobpay' => 'MobPay (QR Code)',
        'eshoppay' => 'eShopPay (QR Code)',
    ];

    /**
     * Les providers KaliaPay possibles.
     */
    const PROVIDERS_KALIAPAY = [
        'orangeci' => 'Orange Money CI',
        'waveci' => 'Wave CI',
        'mtnci' => 'MTN Mobile Money CI',
        'cards' => 'Cartes bancaires',
    ];

    /**
     * Obtenir l'utilisateur propriétaire de la commande.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Obtenir la boutique associée à la commande.
     */
    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }

    /**
     * Obtenir les produits de la commande.
     */
    public function produits(): BelongsToMany
    {
        return $this->belongsToMany(Produit::class, 'commande_produit')
                    ->withPivot('quantite', 'prix_unitaire')
                    ->withTimestamps();
    }

    /**
     * Obtenir le paiement associé à la commande.
     */
    public function paiement()
    {
        return $this->hasOne(Paiement::class);
    }

    /**
     * Vérifier si la commande peut être annulée.
     */
    public function peutEtreAnnulee(): bool
    {
        return in_array($this->statut, ['en_attente', 'confirmee']);
    }

    /**
     * Vérifier si la commande contient des produits digitaux.
     */
    public function contientProduitsDigitaux(): bool
    {
        return $this->produits()->where('type', 'digital')->exists();
    }

    /**
     * Vérifier si la commande contient des produits physiques.
     */
    public function contientProduitsPhysiques(): bool
    {
        return $this->produits()->where('type', 'physique')->exists();
    }

    /**
     * Obtenir le libellé du statut.
     */
    public function getLibelleStatutAttribute(): string
    {
        return self::STATUTS[$this->statut] ?? $this->statut;
    }

    /**
     * Obtenir le libellé de la méthode de paiement.
     */
    public function getLibelleMethodePaiementAttribute(): string
    {
        return self::METHODES_PAIEMENT[$this->methode_paiement] ?? $this->methode_paiement;
    }

    /**
     * Obtenir le libellé du type de paiement KaliaPay.
     */
    public function getLibelleTypeKaliaPayAttribute(): ?string
    {
        if ($this->methode_paiement !== 'kaliapay' || !$this->type_paiement_kalia) {
            return null;
        }

        return self::TYPES_KALIAPAY[$this->type_paiement_kalia] ?? $this->type_paiement_kalia;
    }

    /**
     * Obtenir le libellé du provider KaliaPay.
     */
    public function getLibelleProviderKaliaAttribute(): ?string
    {
        if ($this->methode_paiement !== 'kaliapay' || !$this->provider_kalia) {
            return null;
        }

        return self::PROVIDERS_KALIAPAY[$this->provider_kalia] ?? $this->provider_kalia;
    }

    /**
     * Calculer le montant net pour la boutique (montant total - frais).
     */
    public function getMontantNetAttribute(): float
    {
        return $this->montant_total - $this->frais_commission;
    }

    /**
     * Scope pour les commandes d'un utilisateur.
     */
    public function scopePourUtilisateur($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope pour les commandes avec un statut spécifique.
     */
    public function scopeAvecStatut($query, $statut)
    {
        return $query->where('statut', $statut);
    }

    /**
     * Scope pour les commandes payées.
     */
    public function scopePayees($query)
    {
        return $query->where('statut', 'payee');
    }

    /**
     * Scope pour les commandes en attente.
     */
    public function scopeEnAttente($query)
    {
        return $query->where('statut', 'en_attente');
    }

    /**
     * Scope pour les commandes annulées.
     */
    public function scopeAnnulees($query)
    {
        return $query->where('statut', 'annulee');
    }

    /**
     * Scope pour les commandes utilisant KaliaPay.
     */
    public function scopeAvecKaliaPay($query)
    {
        return $query->where('methode_paiement', 'kaliapay');
    }

    /**
     * Marquer la commande comme payée.
     */
    public function marquerCommePayee(string $transactionId = null): bool
    {
        return $this->update([
            'statut' => 'payee',
            'transaction_id' => $transactionId
        ]);
    }

    /**
     * Marquer la commande comme annulée.
     */
    public function marquerCommeAnnulee(): bool
    {
        return $this->update(['statut' => 'annulee']);
    }

    /**
     * Marquer la commande comme livrée.
     */
    public function marquerCommeLivree(): bool
    {
        return $this->update(['statut' => 'livree']);
    }

    /**
     * Vérifier si la commande est payée.
     */
    public function estPayee(): bool
    {
        return $this->statut === 'payee';
    }

    /**
     * Vérifier si la commande est annulée.
     */
    public function estAnnulee(): bool
    {
        return $this->statut === 'annulee';
    }

    /**
     * Vérifier si la commande est en attente de paiement.
     */
    public function estEnAttente(): bool
    {
        return $this->statut === 'en_attente';
    }

    /**
     * Générer une référence unique pour la commande.
     */
    public static function genererReference(): string
    {
        do {
            $reference = 'CMD-' . strtoupper(uniqid());
        } while (self::where('reference', $reference)->exists());

        return $reference;
    }

    /**
     * Boot du modèle.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($commande) {
            if (empty($commande->reference)) {
                $commande->reference = self::genererReference();
            }
        });

        static::deleting(function ($commande) {
            // Supprimer les enregistrements liés dans la table pivot
            $commande->produits()->detach();
            
            // Supprimer le paiement associé
            if ($commande->paiement) {
                $commande->paiement()->delete();
            }
        });
    }
}