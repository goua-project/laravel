<?php

// app/Http/Controllers/CommandeController.php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\Boutique;
use Illuminate\Http\Request;

class CommandeController extends Controller
{
    public function index(Boutique $boutique)
    {
        $commandes = $boutique->commandes()->with('user')->latest()->get();
        return view('commandes.index', compact('boutique', 'commandes'));
    }

    public function show(Commande $commande)
    {
        $commande->load('produits', 'user');
        return view('commandes.show', compact('commande'));
    }

    public function updateStatut(Request $request, Commande $commande)
    {
        $request->validate([
            'statut' => 'required|in:en_attente,payee,en_cours,livree,annulee',
        ]);

        $commande->update(['statut' => $request->statut]);

        // Envoyer une notification au client si nécessaire

        return back()->with('success', 'Statut de la commande mis à jour.');
    }

    // ... autres méthodes
}

    public function destroy(Commande $commande)
    {
        $commande->delete();
        return redirect()->route('boutiques.commandes.index', $commande->boutique)->with('success', 'Commande supprimée avec succès.');
    }
}
