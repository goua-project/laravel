<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class BoutiqueView extends Model
{
    use HasFactory;

    protected $fillable = [
        'boutique_id',
        'ip_address',
        'user_agent',
        'referrer',
        'country',
        'city',
        'device_type',
        'browser',
        'os',
        'viewed_at'
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
    ];

    /**
     * Relation avec la boutique
     */
    public function boutique()
    {
        return $this->belongsTo(Boutique::class);
    }

    /**
     * Scope pour les vues d'aujourd'hui
     */
    public function scopeToday($query)
    {
        return $query->whereDate('viewed_at', Carbon::today());
    }

    /**
     * Scope pour les vues de cette semaine
     */
    public function scopeThisWeek($query)
    {
        return $query->whereBetween('viewed_at', [
            Carbon::now()->startOfWeek(),
            Carbon::now()->endOfWeek()
        ]);
    }

    /**
     * Scope pour les vues de ce mois
     */
    public function scopeThisMonth($query)
    {
        return $query->whereMonth('viewed_at', Carbon::now()->month)
                    ->whereYear('viewed_at', Carbon::now()->year);
    }

    /**
     * Scope pour les vues de cette année
     */
    public function scopeThisYear($query)
    {
        return $query->whereYear('viewed_at', Carbon::now()->year);
    }

    /**
     * Scope pour une période spécifique
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('viewed_at', [$startDate, $endDate]);
    }

    /**
     * Scope pour les vues uniques (par IP et par jour)
     */
    public function scopeUnique($query)
    {
        return $query->selectRaw('DATE(viewed_at) as date, ip_address, MIN(viewed_at) as first_view')
                    ->groupBy('date', 'ip_address', 'boutique_id');
    }
}