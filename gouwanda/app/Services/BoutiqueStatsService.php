<?php

namespace App\Services;

use App\Models\Boutique;
use App\Models\BoutiqueView;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request;
use Jenssegers\Agent\Agent;

class BoutiqueStatsService
{
    /**
     * Enregistrer une vue de boutique
     */
    public function recordView(Boutique $boutique, $request = null)
    {
        if (!$request) {
            $request = request();
        }

        $agent = new Agent();
        $agent->setUserAgent($request->userAgent());

        // Vérifier si c'est une vue unique (même IP dans les 30 dernières minutes)
        $recentView = BoutiqueView::where('boutique_id', $boutique->id)
            ->where('ip_address', $request->ip())
            ->where('viewed_at', '>', Carbon::now()->subMinutes(30))
            ->exists();

        // Si pas de vue récente, enregistrer la nouvelle vue
        if (!$recentView) {
            BoutiqueView::create([
                'boutique_id' => $boutique->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'referrer' => $request->header('referer'),
                'device_type' => $this->getDeviceType($agent),
                'browser' => $agent->browser(),
                'os' => $agent->platform(),
                'viewed_at' => Carbon::now(),
            ]);

            return true;
        }

        return false;
    }

    /**
     * Obtenir les statistiques de vue pour une boutique
     */
    public function getViewStats(Boutique $boutique, $period = 'month')
    {
        $query = BoutiqueView::where('boutique_id', $boutique->id);

        switch ($period) {
            case 'today':
                $query->today();
                $previousQuery = BoutiqueView::where('boutique_id', $boutique->id)
                    ->whereDate('viewed_at', Carbon::yesterday());
                break;
            case 'week':
                $query->thisWeek();
                $previousQuery = BoutiqueView::where('boutique_id', $boutique->id)
                    ->whereBetween('viewed_at', [
                        Carbon::now()->subWeek()->startOfWeek(),
                        Carbon::now()->subWeek()->endOfWeek()
                    ]);
                break;
            case 'month':
                $query->thisMonth();
                $previousQuery = BoutiqueView::where('boutique_id', $boutique->id)
                    ->whereMonth('viewed_at', Carbon::now()->subMonth()->month)
                    ->whereYear('viewed_at', Carbon::now()->subMonth()->year);
                break;
            case 'year':
                $query->thisYear();
                $previousQuery = BoutiqueView::where('boutique_id', $boutique->id)
                    ->whereYear('viewed_at', Carbon::now()->subYear()->year);
                break;
            default:
                $query->thisMonth();
                $previousQuery = BoutiqueView::where('boutique_id', $boutique->id)
                    ->whereMonth('viewed_at', Carbon::now()->subMonth()->month)
                    ->whereYear('viewed_at', Carbon::now()->subMonth()->year);
        }

        $currentViews = $query->count();
        $previousViews = $previousQuery->count();

        // Calculer la croissance
        $growth = 0;
        if ($previousViews > 0) {
            $growth = round((($currentViews - $previousViews) / $previousViews) * 100, 1);
        } elseif ($currentViews > 0) {
            $growth = 100;
        }

        return [
            'total_views' => $currentViews,
            'previous_views' => $previousViews,
            'growth' => $growth,
            'unique_views' => $this->getUniqueViews($boutique, $period)
        ];
    }

    /**
     * Obtenir les vues uniques pour une période
     */
    public function getUniqueViews(Boutique $boutique, $period = 'month')
    {
        $query = BoutiqueView::where('boutique_id', $boutique->id);

        switch ($period) {
            case 'today':
                $query->today();
                break;
            case 'week':
                $query->thisWeek();
                break;
            case 'month':
                $query->thisMonth();
                break;
            case 'year':
                $query->thisYear();
                break;
        }

        return $query->select('ip_address')
                    ->distinct()
                    ->count();
    }

    /**
     * Obtenir les données de vues par jour pour les graphiques
     */
    public function getViewsChartData(Boutique $boutique, $days = 30)
    {
        $endDate = Carbon::now();
        $startDate = $endDate->copy()->subDays($days - 1);

        $views = BoutiqueView::where('boutique_id', $boutique->id)
            ->whereBetween('viewed_at', [$startDate, $endDate])
            ->selectRaw('DATE(viewed_at) as date, COUNT(*) as views')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $chartData = [];
        for ($date = $startDate->copy(); $date <= $endDate; $date->addDay()) {
            $dateString = $date->format('Y-m-d');
            $chartData[] = [
                'date' => $dateString,
                'views' => $views->get($dateString)->views ?? 0,
                'formatted_date' => $date->format('d/m')
            ];
        }

        return $chartData;
    }

    /**
     * Obtenir les statistiques par device type
     */
    public function getDeviceStats(Boutique $boutique, $period = 'month')
    {
        $query = BoutiqueView::where('boutique_id', $boutique->id);

        switch ($period) {
            case 'today':
                $query->today();
                break;
            case 'week':
                $query->thisWeek();
                break;
            case 'month':
                $query->thisMonth();
                break;
            case 'year':
                $query->thisYear();
                break;
        }

        return $query->select('device_type', DB::raw('COUNT(*) as count'))
                    ->groupBy('device_type')
                    ->get()
                    ->mapWithKeys(function ($item) {
                        return [$item->device_type ?? 'unknown' => $item->count];
                    });
    }

    /**
     * Obtenir les statistiques par navigateur
     */
    public function getBrowserStats(Boutique $boutique, $period = 'month')
    {
        $query = BoutiqueView::where('boutique_id', $boutique->id);

        switch ($period) {
            case 'today':
                $query->today();
                break;
            case 'week':
                $query->thisWeek();
                break;
            case 'month':
                $query->thisMonth();
                break;
            case 'year':
                $query->thisYear();
                break;
        }

        return $query->select('browser', DB::raw('COUNT(*) as count'))
                    ->whereNotNull('browser')
                    ->groupBy('browser')
                    ->orderByDesc('count')
                    ->limit(10)
                    ->get();
    }

    /**
     * Obtenir les pages référentes
     */
    public function getReferrerStats(Boutique $boutique, $period = 'month')
    {
        $query = BoutiqueView::where('boutique_id', $boutique->id);

        switch ($period) {
            case 'today':
                $query->today();
                break;
            case 'week':
                $query->thisWeek();
                break;
            case 'month':
                $query->thisMonth();
                break;
            case 'year':
                $query->thisYear();
                break;
        }

        return $query->select('referrer', DB::raw('COUNT(*) as count'))
                    ->whereNotNull('referrer')
                    ->groupBy('referrer')
                    ->orderByDesc('count')
                    ->limit(10)
                    ->get();
    }

    /**
     * Obtenir toutes les statistiques complètes
     */
    public function getCompleteStats(Boutique $boutique, $period = 'month')
    {
        return [
            'views' => $this->getViewStats($boutique, $period),
            'chart_data' => $this->getViewsChartData($boutique, $this->getDaysForPeriod($period)),
            'devices' => $this->getDeviceStats($boutique, $period),
            'browsers' => $this->getBrowserStats($boutique, $period),
            'referrers' => $this->getReferrerStats($boutique, $period),
        ];
    }

    /**
     * Déterminer le type d'appareil
     */
    private function getDeviceType(Agent $agent)
    {
        if ($agent->isMobile()) {
            return 'mobile';
        } elseif ($agent->isTablet()) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }

    /**
     * Obtenir le nombre de jours pour une période
     */
    private function getDaysForPeriod($period)
    {
        switch ($period) {
            case 'today':
                return 1;
            case 'week':
                return 7;
            case 'month':
                return 30;
            case 'year':
                return 365;
            default:
                return 30;
        }
    }
}