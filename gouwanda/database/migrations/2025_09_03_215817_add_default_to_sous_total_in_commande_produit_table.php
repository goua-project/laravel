<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('commande_produit', function (Blueprint $table) {
            // Modifier la colonne sous_total pour ajouter une valeur par défaut
            $table->decimal('sous_total', 10, 2)->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('commande_produit', function (Blueprint $table) {
            // Revenir à la définition précédente sans valeur par défaut
            $table->decimal('sous_total', 10, 2)->default(null)->change();
        });
    }
};
