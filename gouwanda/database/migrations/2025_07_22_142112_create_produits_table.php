<?php

// database/migrations/[timestamp]_create_produits_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('produits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->constrained()->onDelete('cascade');
            $table->string('nom');
            $table->text('description');
            $table->decimal('prix', 10, 2);
            $table->enum('type', ['physique', 'digital', 'service']);
            $table->integer('stock')->default(0);
            $table->string('image')->nullable();
            $table->json('options')->nullable(); // Pour les variations de produits
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('produits');
    }
};