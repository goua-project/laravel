<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Boutique extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nom',
        'slug',
        'type',
        'slogan',
        'description',
        'categorie',
        'couleur_accent',
        'logo',
        'mots_cles',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'mots_cles' => 'array'
    ];

    protected $appends = [
        'total_views',
        'unique_views',
        'monthly_views',
        'weekly_views',
        'daily_views'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function produits()
    {
        return $this->hasMany(Produit::class);
    }

    public function commandes()
    {
        return $this->hasMany(Commande::class);
    }

    public function getRouteKeyName()
    {
        return 'slug';
    }


  

    /**
     * Relation avec les vues
     */
    public function views()
    {
        return $this->hasMany(BoutiqueView::class);
    }

    /**
     * Obtenir le total des vues
     */
    public function getTotalViewsAttribute()
    {
        return $this->views()->count();
    }

    /**
     * Obtenir les vues uniques (par IP)
     */
    public function getUniqueViewsAttribute()
    {
        return $this->views()->distinct('ip_address')->count();
    }

    /**
     * Obtenir les vues du mois
     */
    public function getMonthlyViewsAttribute()
    {
        return $this->views()->thisMonth()->count();
    }

    /**
     * Obtenir les vues de la semaine
     */
    public function getWeeklyViewsAttribute()
    {
        return $this->views()->thisWeek()->count();
    }

    /**
     * Obtenir les vues du jour
     */
    public function getDailyViewsAttribute()
    {
        return $this->views()->today()->count();
    }

    /**
     * Générer un slug unique
     */
    public static function generateUniqueSlug($nom)
    {
        $slug = Str::slug($nom);
        $originalSlug = $slug;
        $counter = 1;

        while (static::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Boot method pour auto-générer le slug
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($boutique) {
            if (empty($boutique->slug)) {
                $boutique->slug = static::generateUniqueSlug($boutique->nom);
            }
        });

        static::updating(function ($boutique) {
            if ($boutique->isDirty('nom') && !$boutique->isDirty('slug')) {
                $boutique->slug = static::generateUniqueSlug($boutique->nom);
            }
        });
    }

    /**
     * Scope pour les boutiques actives
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope pour les boutiques par catégorie
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('categorie', $category);
    }

    /**
     * Scope pour les boutiques par type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Obtenir l'URL complète du logo
     */
    public function getLogoUrlAttribute()
    {
        if (!$this->logo) {
            return null;
        }

        if (Str::startsWith($this->logo, ['http://', 'https://'])) {
            return $this->logo;
        }

        return asset('storage/' . $this->logo);
    }

    /**
     * Obtenir l'URL de la boutique
     */
    public function getUrlAttribute()
    {
        return route('boutique.show', $this->slug);
    }
}