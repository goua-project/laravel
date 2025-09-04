<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Vérifier si un admin existe déjà
        $adminExists = User::where('role', 'admin')->exists();
        
        if (!$adminExists) {
            // Créer l'utilisateur admin principal
            User::create([
                'nom' => 'Admin',
                'prenom' => 'Gouwadan',
                'telephone' => '+225 07 00 00 00 01',
                'localite' => 'Abidjan',
                'pays' => 'Côte d\'Ivoire',
                'email' => 'admin@gouwadan.com',
                'password' => Hash::make('Admin@2024'),
                'role' => 'admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            $this->command->info('✅ Utilisateur admin créé avec succès !');
            $this->command->info('📧 Email: admin@gouwadan.com');
            $this->command->info('🔒 Mot de passe: Admin@2024');
        } else {
            $this->command->info('ℹ️  Un utilisateur admin existe déjà dans la base de données.');
        }

        
    }
}