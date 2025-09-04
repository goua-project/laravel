<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\Pivot;

class CommandeProduit extends Pivot
{
    use HasFactory;

    /**
     * Indique si les IDs sont auto-incrémentés.
     *
     * @var bool
     */
    public $incrementing = true;

    /**
     * Les attributs qui sont mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'commande_id',
        'produit_id',
        'quantite',
        'prix_unitaire'
    ];

    /**
     * Les attributs qui doivent être castés.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'quantite' => 'integer',
        'prix_unitaire' => 'decimal:2',
    ];

    /**
     * Calculer le sous-total pour ce produit.
     */
    public function getSousTotalAttribute(): float
    {
        return $this->quantite * $this->prix_unitaire;
    }
}