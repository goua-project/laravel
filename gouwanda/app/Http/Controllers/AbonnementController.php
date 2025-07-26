<?php

// app/Http/Controllers/AbonnementController.php

namespace App\Http\Controllers;

use App\Models\Abonnement;
use App\Models\PlanAbonnement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AbonnementController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('role:vendeur')->except(['index', 'show']);
    }

    public function index()
    {
        $plans = PlanAbonnement::where('is_active', true)->get();
        $abonnementActuel = Auth::user()->abonnementActuel();

        return view('abonnements.index', compact('plans', 'abonnementActuel'));
    }

    public function show(PlanAbonnement $plan)
    {
        return view('abonnements.show', compact('plan'));
    }

    public function souscrire(Request $request, PlanAbonnement $plan)
    {
        $user = $request->user();

        // Vérifier si l'utilisateur a déjà un abonnement actif
        if ($user->abonnementActuel()) {
            return redirect()->route('abonnements.index')
                ->with('warning', 'Vous avez déjà un abonnement actif.');
        }

        // Créer le nouvel abonnement
        $abonnement = Abonnement::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'date_debut' => now(),
            'date_fin' => now()->addDays($plan->duree_jours),
            'statut' => 'actif',
            'reference_paiement' => 'PAY-' . strtoupper(uniqid())
        ]);

        // Ici vous devriez intégrer le système de paiement PayDunya
        // Ceci est juste un exemple simplifié

        return redirect()->route('abonnements.index')
            ->with('success', 'Abonnement souscrit avec succès!');
    }

    public function annuler(Abonnement $abonnement)
    {
        // Vérifier que l'abonnement appartient bien à l'utilisateur
        if ($abonnement->user_id !== auth()->id()) {
            abort(403);
        }

        $abonnement->update(['statut' => 'annule']);

        return redirect()->route('abonnements.index')
            ->with('success', 'Abonnement annulé avec succès.');
    }

    public function renouveler(Abonnement $abonnement)
    {
        // Vérifier que l'abonnement appartient bien à l'utilisateur
        if ($abonnement->user_id !== auth()->id()) {
            abort(403);
        }

        // Prolonger l'abonnement
        $abonnement->prolonger($abonnement->plan->duree_jours);

        // Ici vous devriez intégrer le système de paiement PayDunya pour le renouvellement

        return redirect()->route('abonnements.index')
            ->with('success', 'Abonnement renouvelé avec succès!');
    }
}