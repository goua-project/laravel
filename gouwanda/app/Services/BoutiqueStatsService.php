<?php

namespace App\Services;

use App\Models\Boutique;
use App\Models\BoutiqueView;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Jenssegers\Agent\Agent;

class BoutiqueStatsService
{
    /**
     * Enregistrer une vue de boutique avec informations géographiques
     */
    public function recordView(Boutique $boutique, $request = null)
    {
        try {
            if (!$request) {
                $request = request();
            }

            $agent = new Agent();
            $agent->setUserAgent($request->userAgent());

            $ipAddress = $this->getRealIpAddress($request);

            // Vérifier si c'est une vue unique (même IP dans les 30 dernières minutes)
            $recentView = BoutiqueView::where('boutique_id', $boutique->id)
                ->where('ip_address', $ipAddress)
                ->where('viewed_at', '>', Carbon::now()->subMinutes(30))
                ->exists();

            // Si pas de vue récente, enregistrer la nouvelle vue
            if (!$recentView) {
                // Obtenir les informations géographiques
                $geoInfo = $this->getGeolocationInfo($ipAddress);
                
                BoutiqueView::create([
                    'boutique_id' => $boutique->id,
                    'ip_address' => $ipAddress,
                    'user_agent' => $request->userAgent(),
                    'referrer' => $request->header('referer'),
                    'country' => $geoInfo['country'] ?? null,
                    'city' => $geoInfo['city'] ?? null,
                    'device_type' => $this->getDeviceType($agent),
                    'browser' => $agent->browser(),
                    'os' => $agent->platform(),
                    'viewed_at' => Carbon::now(),
                ]);

                // Log pour débug
                Log::info('Vue de boutique enregistrée', [
                    'boutique_id' => $boutique->id,
                    'boutique_name' => $boutique->nom,
                    'ip_address' => $ipAddress,
                    'user_agent' => $request->userAgent(),
                    'device_type' => $this->getDeviceType($agent),
                    'country' => $geoInfo['country'] ?? null,
                    'city' => $geoInfo['city'] ?? null,
                ]);

                return true;
            }

            Log::info('Vue de boutique non enregistrée (récente)', [
                'boutique_id' => $boutique->id,
                'ip_address' => $ipAddress
            ]);

            return false;

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'enregistrement de la vue:', [
                'boutique_id' => $boutique->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return false;
        }
    }

    /**
     * Obtenir la vraie adresse IP du visiteur
     */
    private function getRealIpAddress($request)
    {
        // Vérifier plusieurs en-têtes possibles pour l'IP réelle
        $ipKeys = [
            'HTTP_CF_CONNECTING_IP',     // CloudFlare
            'HTTP_X_REAL_IP',            // Nginx proxy
            'HTTP_X_FORWARDED_FOR',      // Proxy standard
            'HTTP_X_FORWARDED',          // Proxy
            'HTTP_X_CLUSTER_CLIENT_IP',  // Cluster
            'HTTP_FORWARDED_FOR',        // Proxy
            'HTTP_FORWARDED',            // Proxy
            'REMOTE_ADDR'                // IP standard
        ];

        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                $ip = $_SERVER[$key];
                if (strpos($ip, ',') !== false) {
                    $ip = explode(',', $ip)[0];
                }
                $ip = trim($ip);
                
                if (filter_var($ip, FILTER_VALIDATE_IP, 
                    FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }

        return $request->ip();
    }

    /**
     * Obtenir les informations de géolocalisation
     */
    private function getGeolocationInfo($ip)
    {
        try {
            // Ne pas faire de géolocalisation pour les IPs locales
            if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return [
                    'country' => 'Local',
                    'city' => 'Local'
                ];
            }

            // Utiliser un service de géolocalisation gratuit
            $url = "http://ip-api.com/json/{$ip}";
            $context = stream_context_create([
                'http' => [
                    'timeout' => 3, // Timeout de 3 secondes
                    'method' => 'GET'
                ]
            ]);
            
            $response = @file_get_contents($url, false, $context);
            
            if ($response) {
                $data = json_decode($response, true);
                if ($data && $data['status'] === 'success') {
                    return [
                        'country' => $data['country'] ?? null,
                        'city' => $data['city'] ?? null
                    ];
                }
            }

        } catch (\Exception $e) {
            Log::warning('Erreur géolocalisation IP:', [
                'ip' => $ip,
                'error' => $e->getMessage()
            ]);
        }

        return [
            'country' => null,
            'city' => null
        ];
    }

    /**
     * Obtenir les statistiques de vue pour une boutique
     */
    public function getViewStats(Boutique $boutique, $period = 'month')
    {
        $query = BoutiqueView::where('boutique_id', $boutique->id);

        switch ($period) {
            case 'today':
                $query->whereDate('viewed_at', Carbon::today());
                $previousQuery = BoutiqueView::where('boutique_id', $boutique->id)
                    ->whereDate('viewed_at', Carbon::yesterday());
                break;
            case 'week':
                $query->whereBetween('viewed_at', [
                    Carbon::now()->startOfWeek(),
                    Carbon::now()->endOfWeek()
                ]);
                $previousQuery = BoutiqueView::where('boutique_id', $boutique->id)
                    ->whereBetween('viewed_at', [
                        Carbon::now()->subWeek()->startOfWeek(),
                        Carbon::now()->subWeek()->endOfWeek()
                    ]);
                break;
            case 'month':
                $query->whereMonth('viewed_at', Carbon::now()->month)
                      ->whereYear('viewed_at', Carbon::now()->year);
                $previousQuery = BoutiqueView::where('boutique_id', $boutique->id)
                    ->whereMonth('viewed_at', Carbon::now()->subMonth()->month)
                    ->whereYear('viewed_at', Carbon::now()->subMonth()->year);
                break;
            case 'year':
                $query->whereYear('viewed_at', Carbon::now()->year);
                $previousQuery = BoutiqueView::where('boutique_id', $boutique->id)
                    ->whereYear('viewed_at', Carbon::now()->subYear()->year);
                break;
            default:
                $query->whereMonth('viewed_at', Carbon::now()->month)
                      ->whereYear('viewed_at', Carbon::now()->year);
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
                $query->whereDate('viewed_at', Carbon::today());
                break;
            case 'week':
                $query->whereBetween('viewed_at', [
                    Carbon::now()->startOfWeek(),
                    Carbon::now()->endOfWeek()
                ]);
                break;
            case 'month':
                $query->whereMonth('viewed_at', Carbon::now()->month)
                      ->whereYear('viewed_at', Carbon::now()->year);
                break;
            case 'year':
                $query->whereYear('viewed_at', Carbon::now()->year);
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
            ->selectRaw('DATE(viewed_at) as date, COUNT(*) as views, COUNT(DISTINCT ip_address) as unique_views')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $chartData = [];
        for ($date = $startDate->copy(); $date <= $endDate; $date->addDay()) {
            $dateString = $date->format('Y-m-d');
            $viewData = $views->get($dateString);
            
            $chartData[] = [
                'date' => $dateString,
                'views' => $viewData ? $viewData->views : 0,
                'unique_views' => $viewData ? $viewData->unique_views : 0,
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
                $query->whereDate('viewed_at', Carbon::today());
                break;
            case 'week':
                $query->whereBetween('viewed_at', [
                    Carbon::now()->startOfWeek(),
                    Carbon::now()->endOfWeek()
                ]);
                break;
            case 'month':
                $query->whereMonth('viewed_at', Carbon::now()->month)
                      ->whereYear('viewed_at', Carbon::now()->year);
                break;
            case 'year':
                $query->whereYear('viewed_at', Carbon::now()->year);
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
     * Obtenir les statistiques par pays
     */
    public function getCountryStats(Boutique $boutique, $period = 'month')
    {
        $query = BoutiqueView::where('boutique_id', $boutique->id);

        switch ($period) {
            case 'today':
                $query->whereDate('viewed_at', Carbon::today());
                break;
            case 'week':
                $query->whereBetween('viewed_at', [
                    Carbon::now()->startOfWeek(),
                    Carbon::now()->endOfWeek()
                ]);
                break;
            case 'month':
                $query->whereMonth('viewed_at', Carbon::now()->month)
                      ->whereYear('viewed_at', Carbon::now()->year);
                break;
            case 'year':
                $query->whereYear('viewed_at', Carbon::now()->year);
                break;
        }

        return $query->select('country', DB::raw('COUNT(*) as count'))
                    ->whereNotNull('country')
                    ->groupBy('country')
                    ->orderByDesc('count')
                    ->limit(10)
                    ->get();
    }

    /**
     * Obtenir les statistiques par navigateur
     */
    public function getBrowserStats(Boutique $boutique, $period = 'month')
    {
        $query = BoutiqueView::where('boutique_id', $boutique->id);

        switch ($period) {
            case 'today':
                $query->whereDate('viewed_at', Carbon::today());
                break;
            case 'week':
                $query->whereBetween('viewed_at', [
                    Carbon::now()->startOfWeek(),
                    Carbon::now()->endOfWeek()
                ]);
                break;
            case 'month':
                $query->whereMonth('viewed_at', Carbon::now()->month)
                      ->whereYear('viewed_at', Carbon::now()->year);
                break;
            case 'year':
                $query->whereYear('viewed_at', Carbon::now()->year);
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
                $query->whereDate('viewed_at', Carbon::today());
                break;
            case 'week':
                $query->whereBetween('viewed_at', [
                    Carbon::now()->startOfWeek(),
                    Carbon::now()->endOfWeek()
                ]);
                break;
            case 'month':
                $query->whereMonth('viewed_at', Carbon::now()->month)
                      ->whereYear('viewed_at', Carbon::now()->year);
                break;
            case 'year':
                $query->whereYear('viewed_at', Carbon::now()->year);
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
            'countries' => $this->getCountryStats($boutique, $period),
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