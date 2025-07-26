<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('plans_abonnement', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('slug')->unique();
            $table->text('description');
            $table->decimal('prix', 10, 2)->default(0);
            $table->integer('commission')->nullable()->comment('Pourcentage de commission');
            $table->integer('limite_produits')->nullable()->comment('Null = illimité');
            $table->boolean('mobile_money')->default(false);
            $table->boolean('dashboard_boutique')->default(false);
            $table->boolean('personnalisation_avancee')->default(false);
            $table->boolean('statistiques_seo')->default(false);
            $table->boolean('support_prioritaire')->default(false);
            $table->boolean('certificat_avance')->default(false);
            $table->boolean('multi_utilisateurs')->default(false);
            $table->boolean('rapports_exportables')->default(false);
            $table->boolean('support_dedie')->default(false);
            $table->boolean('is_free')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('plans_abonnement');
    }
};