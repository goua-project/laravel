<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'nom',
        'prenom',
        'telephone',
        'localite',
        'pays',
        'email',
        'password',
        'role',
        'is_active'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function boutiques()
    {
        return $this->hasMany(Boutique::class);
    }

    public function commandes()
    {
        return $this->hasMany(Commande::class);
    }

    public function abonnements()
{
    return $this->hasMany(Abonnement::class);
}

public function abonnementActuel()
{
    return $this->abonnements()
        ->where('statut', 'actif')
        ->where('date_fin', '>', now())
        ->latest()
        ->first();
}

public function hasActiveAbonnement()
{
    return (bool) $this->abonnementActuel();
}
}