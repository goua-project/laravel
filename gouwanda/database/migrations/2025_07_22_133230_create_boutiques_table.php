<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('boutiques', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('nom');
            $table->string('slug')->unique();
            $table->string('slogan')->nullable();
            $table->text('description');
            $table->string('categorie');
            $table->string('couleur_accent')->default('#3490dc');
            $table->string('logo')->nullable();
            $table->text('mots_cles')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('boutiques');
    }
};