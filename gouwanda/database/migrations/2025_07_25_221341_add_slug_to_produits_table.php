<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Vérifier si la colonne slug existe déjà
        if (Schema::hasColumn('produits', 'slug')) {
            // Supprimer d'abord la contrainte unique si elle existe
            try {
                Schema::table('produits', function ($table) {
                    $table->dropUnique(['slug']);
                });
            } catch (Exception $e) {
                // La contrainte n'existe peut-être pas
            }

            // Supprimer tous les slugs vides ou en double
            DB::table('produits')->where('slug', '')->orWhereNull('slug')->delete();
            
            // Générer des slugs uniques pour les produits restants
            $this->generateUniqueSlugs();

            // Réajouter la contrainte unique
            Schema::table('produits', function ($table) {
                $table->unique('slug');
            });
        }
    }

    /**
     * Générer des slugs uniques
     */
    private function generateUniqueSlugs()
    {
        $produits = DB::table('produits')->get(['id', 'nom']);
        
        foreach ($produits as $produit) {
            $slug = \Illuminate\Support\Str::slug($produit->nom);
            
            if (empty($slug)) {
                $slug = 'produit-' . $produit->id;
            }
            
            $originalSlug = $slug;
            $counter = 1;

            // Vérifier l'unicité
            while (DB::table('produits')->where('slug', $slug)->where('id', '!=', $produit->id)->exists()) {
                $slug = $originalSlug . '-' . $counter;
                $counter++;
            }

            // Mettre à jour
            DB::table('produits')
                ->where('id', $produit->id)
                ->update(['slug' => $slug]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Ne rien faire car c'est juste un nettoyage
    }
};