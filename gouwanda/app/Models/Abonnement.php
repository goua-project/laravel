<?php

// app/Models/Abonnement.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Abonnement extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'plan_id',
        'date_debut',
        'date_fin',
        'statut',
        'reference_paiement'
    ];

    protected $dates = [
        'date_debut',
        'date_fin',
        'created_at',
        'updated_at'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function plan()
    {
        return $this->belongsTo(PlanAbonnement::class, 'plan_id');
    }

    public function isActive()
    {
        return $this->statut === 'actif' && $this->date_fin > now();
    }

    public function prolonger($dureeJours)
    {
        $this->date_fin = $this->date_fin->addDays($dureeJours);
        $this->save();
        return $this;
    }
}