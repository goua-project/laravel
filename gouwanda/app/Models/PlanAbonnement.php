<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlanAbonnement extends Model
{
    use HasFactory;

    protected $table = 'plans_abonnement';
    protected $fillable = [
        'nom',
        'slug',
        'description',
        'prix',
        'commission',
        'limite_produits',
        'mobile_money',
        'dashboard_boutique',
        'personnalisation_avancee',
        'statistiques_seo',
        'support_prioritaire',
        'certificat_avance',
        'multi_utilisateurs',
        'rapports_exportables',
        'support_dedie',
        'is_free',
        'is_active'
    ];

    protected $casts = [
        'is_free' => 'boolean',
        'is_active' => 'boolean',
        'mobile_money' => 'boolean',
        'dashboard_boutique' => 'boolean',
        'personnalisation_avancee' => 'boolean',
        'statistiques_seo' => 'boolean',
        'support_prioritaire' => 'boolean',
        'certificat_avance' => 'boolean',
        'multi_utilisateurs' => 'boolean',
        'rapports_exportables' => 'boolean',
        'support_dedie' => 'boolean'
    ];

    public function abonnements()
    {
        return $this->hasMany(Abonnement::class, 'plan_id');
    }

    public static function getDefaultPlans()
{
    return [
        [
            'nom' => 'Gratuit',
            'slug' => 'gratuit',
            'description' => 'Plan de base pour commencer',
            'prix' => 0,
            'commission' => 3,
            'limite_produits' => 3,
            'mobile_money' => true,
            'dashboard_boutique' => true,
            'is_free' => true,
            'is_active' => true,
            'duree_mois' => null
        ],
        [
            'nom' => 'Pro',
            'slug' => 'pro',
            'description' => 'Pour les vendeurs sérieux',
            'prix' => 10000,
            'commission' => 0, // ← CORRECTION ici
            'limite_produits' => null, // Illimité
            'mobile_money' => true,
            'dashboard_boutique' => true,
            'personnalisation_avancee' => true,
            'statistiques_seo' => true,
            'support_prioritaire' => true,
            'is_free' => false,
            'is_active' => true,
            'duree_mois' => 1,
        ],
        [
            'nom' => 'Business',
            'slug' => 'business',
            'description' => 'Solution complète pour professionnels',
            'prix' => 25000,
            'commission' => 0, // ← CORRECTION ici
            'limite_produits' => null, // Illimité
            'mobile_money' => true,
            'dashboard_boutique' => true,
            'personnalisation_avancee' => true,
            'statistiques_seo' => true,
            'support_prioritaire' => true,
            'certificat_avance' => true,
            'multi_utilisateurs' => true,
            'rapports_exportables' => true,
            'support_dedie' => true,
            'is_free' => false,
            'is_active' => true,
            'duree_mois' => 1

        ]
    ];
}


    public function getFeaturesAttribute()
    {
        $features = [];

        if ($this->is_free) {
            $features[] = "3% de commission par vente";
            $features[] = "3 produits/services max";
            $features[] = "Paiements Mobile Money";
            $features[] = "Dashboard boutique";
        } else {
            $features[] = "Produits/services illimités";
            $features[] = "Zéro commission";
            
            if ($this->personnalisation_avancee) {
                $features[] = "Personnalisation avancée";
            }
            
            if ($this->statistiques_seo) {
                $features[] = "Statistiques SEO avancées";
            }
            
            if ($this->support_prioritaire) {
                $features[] = "Support prioritaire";
            }
            
            if ($this->certificat_avance) {
                $features[] = "Certificat d'avance";
            }
            
            if ($this->multi_utilisateurs) {
                $features[] = "Compte multi-utilisateurs";
            }
            
            if ($this->rapports_exportables) {
                $features[] = "Rapports exportables";
            }
            
            if ($this->support_dedie) {
                $features[] = "Support dédié";
            }
        }

        return $features;
    }
}