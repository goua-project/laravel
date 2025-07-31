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
    Schema::table('plans_abonnement', function (Blueprint $table) {
        $table->integer('duree_mois')->nullable()->default(null)->after('prix');
    });
}

public function down()
{
    Schema::table('plans_abonnement', function (Blueprint $table) {
        $table->dropColumn('duree_mois');
    });
}

};
