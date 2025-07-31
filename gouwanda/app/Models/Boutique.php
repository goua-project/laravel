<?php

// app/Models/Boutique.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

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
        'daily_views',
        'logo_url'
    ];

    /**
     * Relation avec l'utilisateur propriétaire
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec les produits
     */
    public function produits()
    {
        return $this->hasMany(Produit::class);
    }

    /**
     * Relation avec les produits (alias pour compatibilité)
     */
    public function products()
    {
        return $this->produits();
    }

    /**
     * Relation avec les commandes
     */
    public function commandes()
    {
        return $this->hasMany(Commande::class);
    }

    /**
     * Relation avec les vues
     */
    public function views()
    {
        return $this->hasMany(BoutiqueView::class);
    }

    /**
     * Obtenir le plan actuel de la boutique
     */
    public function getCurrentPlan()
    {
        $abonnement = $this->abonnementActif;
        return $abonnement ? $abonnement->plan : null;
    }

    /**
     * Vérifier si la boutique peut créer des produits
     */
    public function canCreateProducts()
    {
        $plan = $this->getCurrentPlan();
        
        if (!$plan) {
            return false;
        }

        // Si le plan a une limite de produits
        if ($plan->limite_produits !== null) {
            $currentProductCount = $this->produits()->count();
            return $currentProductCount < $plan->limite_produits;
        }

        // Plan illimité
        return true;
    }

    /**
     * Obtenir le nombre de produits restants autorisés
     */
    public function getRemainingProductsCount()
    {
        $plan = $this->getCurrentPlan();
        
        if (!$plan) {
            return 0;
        }

        if ($plan->limite_produits === null) {
            return -1; // Illimité
        }

        $currentProductCount = $this->produits()->count();
        return max(0, $plan->limite_produits - $currentProductCount);
    }

    /**
     * Vérifier si la boutique peut utiliser une fonctionnalité spécifique
     */
    public function hasFeature($feature)
    {
        $plan = $this->getCurrentPlan();
        
        if (!$plan) {
            return false;
        }

        return $plan->{$feature} ?? false;
    }

    /**
     * Obtenir le taux de commission applicable
     */
    public function getCommissionRate()
    {
        $plan = $this->getCurrentPlan();
        
        if (!$plan) {
            return 3; // Taux par défaut
        }

        // Si le plan a zéro commission, retourner 0
        if ($plan->zero_commission ?? false) {
            return 0;
        }

        return $plan->commission ?? 0;
    }

    /**
     * Vérifier si l'abonnement expire bientôt (dans les 7 jours)
     */
    public function subscriptionExpiresSoon()
    {
        $abonnement = $this->abonnementActif;
        
        if (!$abonnement) {
            return true;
        }

        return $abonnement->date_fin->diffInDays(now()) <= 7;
    }

    /**
     * Obtenir les jours restants avant expiration
     */
    public function getDaysUntilExpiration()
    {
        $abonnement = $this->abonnementActif;
        
        if (!$abonnement) {
            return 0;
        }

        if ($abonnement->date_fin < now()) {
            return 0;
        }

        return $abonnement->date_fin->diffInDays(now());
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

    public function abonnementActif()
{
    // Implémentez la logique pour vérifier si la boutique a un abonnement actif
    // Par exemple:
    return $this->abonnements()->where('actif', true)->exists();
}

public function abonnements()
{
    return $this->hasMany(Abonnement::class);
}



    /**
     * Obtenir l'URL de la boutique
     */
    public function getUrlAttribute()
    {
        return route('boutique.show', $this->slug);
    }

    /**
     * Obtenir le résumé des limitations du plan actuel
     */
    public function getPlanLimitations()
    {
        $plan = $this->getCurrentPlan();
        
        if (!$plan) {
            return [
                'can_create_products' => false,
                'products_limit' => 0,
                'remaining_products' => 0,
                'commission_rate' => 3,
                'features' => []
            ];
        }

        return [
            'can_create_products' => $this->canCreateProducts(),
            'products_limit' => $plan->limite_produits,
            'remaining_products' => $this->getRemainingProductsCount(),
            'commission_rate' => $this->getCommissionRate(),
            'features' => [
                'mobile_money' => $plan->mobile_money ?? false,
                'dashboard_boutique' => $plan->dashboard_boutique ?? false,
                'personnalisation_avancee' => $plan->personnalisation_avancee ?? false,
                'statistiques_seo' => $plan->statistiques_seo ?? false,
                'support_prioritaire' => $plan->support_prioritaire ?? false,
                'certificat_avance' => $plan->certificat_avance ?? false,
                'multi_utilisateurs' => $plan->multi_utilisateurs ?? false,
                'rapports_exportables' => $plan->rapports_exportables ?? false,
                'support_dedie' => $plan->support_dedie ?? false,
            ]
        ];
    }

    /**
     * Méthode pour suspendre la boutique en cas d'abonnement expiré
     */
    public function suspendForExpiredSubscription()
    {
        // Ici vous pouvez ajouter la logique pour suspendre la boutique
        // Par example, masquer les produits, désactiver les commandes, etc.
        
        // Pour l'instant, on peut juste marquer les abonnements comme expirés
        $this->abonnements()
            ->where('statut', 'actif')
            ->where('date_fin', '<', now())
            ->update(['statut' => 'expire']);
    }

    /**
     * Méthode pour réactiver la boutique après renouvellement
     */
    public function reactivateAfterRenewal()
    {
        // Logique pour réactiver la boutique
        // Rendre les produits visibles, réactiver les fonctionnalités, etc.
        
        return true;
    }

    /**
     * Scope pour les boutiques avec abonnement actif
     */
    public function scopeWithActiveSubscription($query)
    {
        return $query->whereHas('abonnementActif');
    }

    /**
     * Scope pour les boutiques avec abonnement expiré
     */
    public function scopeWithExpiredSubscription($query)
    {
        return $query->whereDoesntHave('abonnementActif')
            ->orWhereHas('abonnements', function ($q) {
                $q->where('statut', 'actif')
                  ->where('date_fin', '<', now());
            });
    }

    public function hasReachedProductLimit()
{
    $abonnement = $this->abonnementActif();
    
    if (!$abonnement || !$abonnement->plan) {
        return $this->produits()->published()->count() >= 3;
    }

    return $abonnement->plan->limite_produits !== null 
           && $this->produits()->published()->count() >= $abonnement->plan->limite_produits;
}
}