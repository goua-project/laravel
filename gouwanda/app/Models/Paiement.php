<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'commande_id', // AJOUTEZ CETTE LIGNE
        'montant',
        'methode',
        'reference',
        'statut',
        'details'
    ];

    /**
     * Get the commande that owns the paiement.
     */
    public function commande()
    {
        return $this->belongsTo(Commande::class);
    }
}