<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Produit extends Model
{
    use HasFactory;

    protected $fillable = [
        'boutique_id',
        'nom',
        'slug',
        'description',
        'prix',
        'type',
        'stock',
        'categorie',
        'tags',
        'visible',
        'image',
        'images',
        'lien_telechargement',
        'type_produit_digital',
        'taille_fichier',
        'duree',
        'format',
        'lieu_expedition',
        'delai_livraison',
        'options',
        'is_published'
    ];

    /**
     * Les attributs qui doivent être castés en types natifs.
     */
    protected $casts = [
        'tags' => 'array',        // Cast automatique JSON ↔ Array
        'images' => 'array',      // Cast automatique JSON ↔ Array  
        'options' => 'array',     // Cast automatique JSON ↔ Array
        'prix' => 'decimal:2',
        'visible' => 'boolean',
        'is_published' => 'boolean',
        'stock' => 'integer',
    ];

    /**
     * Boot du modèle pour gérer le slug automatiquement
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($produit) {
            if (empty($produit->slug)) {
                $produit->slug = Str::slug($produit->nom);
            }
        });

        static::updating(function ($produit) {
            if ($produit->isDirty('nom')) {
                $produit->slug = Str::slug($produit->nom);
            }
        });
    }

    /**
     * Relation avec la boutique
     */
    public function boutique()
    {
        return $this->belongsTo(Boutique::class);
    }

    /**
     * Scope pour les produits visibles
     */
    public function scopeVisible($query)
    {
        return $query->where('visible', true);
    }

    /**
     * Scope pour les produits publiés
     */
    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    /**
     * Scope par type de produit
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope par catégorie
     */
    public function scopeInCategory($query, $category)
    {
        return $query->where('categorie', $category);
    }

    /**
     * Accessor pour l'URL de la première image
     */
    public function getImageUrlAttribute()
    {
        if ($this->images && is_array($this->images) && count($this->images) > 0) {
            $firstImage = $this->images[0];
            // Si c'est une URL complète, la retourner telle quelle
            if (filter_var($firstImage, FILTER_VALIDATE_URL)) {
                return $firstImage;
            }
            // Sinon, construire l'URL avec le storage
            return asset('storage/' . $firstImage);
        }
        
        // Image par défaut si aucune image
        return asset('images/product-placeholder.png');
    }

    /**
     * Accessor pour les URLs de toutes les images
     */
    public function getImageUrlsAttribute()
    {
        if (!$this->images || !is_array($this->images)) {
            return [];
        }

        return array_map(function($image) {
            if (filter_var($image, FILTER_VALIDATE_URL)) {
                return $image;
            }
            return asset('storage/' . $image);
        }, $this->images);
    }

    /**
     * Mutator pour s'assurer que le prix est toujours positif
     */
    public function setPrixAttribute($value)
    {
        $this->attributes['prix'] = max(0, (float) $value);
    }

    /**
     * Mutator pour s'assurer que le stock est toujours positif
     */
    public function setStockAttribute($value)
    {
        $this->attributes['stock'] = max(0, (int) $value);
    }
}