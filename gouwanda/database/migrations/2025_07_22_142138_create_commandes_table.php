<?php

// database/migrations/[timestamp]_create_commandes_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('commandes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('boutique_id')->constrained()->onDelete('cascade');
            $table->string('reference')->unique();
            $table->decimal('montant_total', 10, 2);
            $table->decimal('frais_commission', 10, 2)->default(0);
            $table->enum('statut', ['en_attente', 'payee', 'en_cours', 'livree', 'annulee']);
            $table->string('methode_paiement');
            $table->string('transaction_id')->nullable();
            $table->text('adresse_livraison')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('commande_produit', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commande_id')->constrained()->onDelete('cascade');
            $table->foreignId('produit_id')->constrained()->onDelete('cascade');
            $table->integer('quantite');
            $table->decimal('prix_unitaire', 10, 2);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('commande_produit');
        Schema::dropIfExists('commandes');
    }
};