<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PlanAbonnement;

class PlanAbonnementSeeder extends Seeder
{
    public function run(): void
    {
        foreach (PlanAbonnement::getDefaultPlans() as $plan) {
            PlanAbonnement::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
