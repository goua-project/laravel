<?php

namespace App\Services;

use App\Models\Boutique;
use App\Models\BoutiqueView;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class BoutiqueStatsService
{
    /**
     * Enregistrer une vue de boutique avec vérification de doublon
     */
    public function recordView(Boutique $boutique, array $viewData)
    {
        try {
            $ip = $viewData['ip_address'];
            $userAgent = $viewData['user_agent'] ?? 'Unknown';
            $now = now();
            
            // Clé de cache pour éviter les doublons (IP + Boutique dans les 30 dernières minutes)
            $cacheKey = "boutique_view_{$boutique->id}_{$ip}";
            
            // Vérifier si cette IP a déjà visité cette boutique récemment
            if (!($viewData['force_record'] ?? false) && !($viewData['bypass_dedup'] ?? false) && Cache::has($cacheKey)) {
                Log::info('Vue déjà enregistrée récemment', [
                    'boutique_id' => $boutique->id,
                    'ip' => $ip,
                    'cache_key' => $cacheKey
                ]);
                return false; // Vue déjà comptée récemment
            }
            
            // Créer l'enregistrement en base avec les VRAIS champs de la table
            $insertData = [
                'boutique_id' => $boutique->id,
                'ip_address' => substr($ip, 0, 45), // Limiter à la taille de la colonne
                'user_agent' => substr($userAgent, 0, 500),
                'referrer' => isset($viewData['referrer']) ? substr($viewData['referrer'], 0, 500) : null,
                'country' => isset($viewData['country']) ? substr($viewData['country'], 0, 100) : null,
                'city' => isset($viewData['city']) ? substr($viewData['city'], 0, 100) : null,
                'device_type' => isset($viewData['device_type']) ? substr($viewData['device_type'], 0, 50) : $this->detectDeviceType($userAgent),
                'browser' => isset($viewData['browser']) ? substr($viewData['browser'], 0, 100) : $this->detectBrowser($userAgent),
                'os' => isset($viewData['os']) ? substr($viewData['os'], 0, 100) : $this->detectOS($userAgent),
                'viewed_at' => $viewData['viewed_at'] ?? $now,
                'created_at' => $now,
                'updated_at' => $now
            ];
            
            Log::info('Tentative d\'insertion avec données corrigées', [
                'boutique_id' => $boutique->id,
                'data_keys' => array_keys($insertData)
            ]);
            
            // Insérer en base de données
            DB::table('boutique_views')->insert($insertData);
            
            // Mettre en cache pour éviter les doublons (30 minutes)
            if (!($viewData['force_record'] ?? false)) {
                Cache::put($cacheKey, true, now()->addMinutes(30));
            }
            
            // Invalider le cache des statistiques
            $this->invalidateStatsCache($boutique->id);
            
            Log::info('Vue enregistrée avec succès en base', [
                'boutique_id' => $boutique->id,
                'boutique_slug' => $boutique->slug,
                'ip' => $ip,
                'timestamp' => $now->toISOString()
            ]);
            
            return true;
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'enregistrement de la vue', [
                'boutique_id' => $boutique->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return false;
        }
    }

    /**
     * Enregistrer une vue FORCÉE (ignorer la déduplication)
     */
    public function recordViewForced(Boutique $boutique, array $viewData)
    {
        try {
            $ip = $viewData['ip_address'];
            $userAgent = $viewData['user_agent'] ?? 'Unknown';
            $now = now();

            Log::info('Enregistrement de vue FORCÉ - Début', [
                'boutique_id' => $boutique->id,
                'ip' => $ip,
                'force_mode' => true
            ]);

            // Créer l'enregistrement SANS vérifier l'existence avec les VRAIS champs
            $insertData = [
                'boutique_id' => $boutique->id,
                'ip_address' => substr($ip, 0, 45),
                'user_agent' => substr($userAgent, 0, 500),
                'referrer' => isset($viewData['referrer']) ? substr($viewData['referrer'], 0, 500) : null,
                'country' => isset($viewData['country']) ? substr($viewData['country'], 0, 100) : null,
                'city' => isset($viewData['city']) ? substr($viewData['city'], 0, 100) : null,
                'device_type' => isset($viewData['device_type']) ? substr($viewData['device_type'], 0, 50) : $this->detectDeviceType($userAgent),
                'browser' => isset($viewData['browser']) ? substr($viewData['browser'], 0, 100) : $this->detectBrowser($userAgent),
                'os' => isset($viewData['os']) ? substr($viewData['os'], 0, 100) : $this->detectOS($userAgent),
                'viewed_at' => $viewData['viewed_at'] ?? $now,
                'created_at' => $now,
                'updated_at' => $now
            ];

            $viewId = DB::table('boutique_views')->insertGetId($insertData);

            if ($viewId) {
                // Mettre à jour les compteurs
                $this->updateViewCounters($boutique);
                
                Log::info('Vue forcée enregistrée avec succès', [
                    'boutique_id' => $boutique->id,
                    'view_id' => $viewId,
                    'forced' => true
                ]);
                
                return true;
            }

            return false;

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'enregistrement de vue forcé', [
                'boutique_id' => $boutique->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    /**
     * Enregistrer une vue avec données étendues
     */
    public function recordViewExtended(Boutique $boutique, array $viewData)
    {
        try {
            $ip = $viewData['ip_address'];
            $userAgent = $viewData['user_agent'] ?? 'Unknown';
            $now = now();

            Log::info('Enregistrement de vue ÉTENDU - Début', [
                'boutique_id' => $boutique->id,
                'ip' => $ip
            ]);

            // Vérifier si cette vue existe déjà (mais avec critères plus stricts)
            $recentView = $this->getRecentView($boutique, $ip, $userAgent, 300); // 5 minutes

            if (!$recentView || ($viewData['force_record'] ?? false)) {
                // Créer l'enregistrement avec les VRAIS champs de la table
                $insertData = [
                    'boutique_id' => $boutique->id,
                    'ip_address' => substr($ip, 0, 45),
                    'user_agent' => substr($userAgent, 0, 500),
                    'referrer' => isset($viewData['referrer']) ? substr($viewData['referrer'], 0, 500) : null,
                    'country' => isset($viewData['country']) ? substr($viewData['country'], 0, 100) : $this->getCountryFromIP($ip),
                    'city' => isset($viewData['city']) ? substr($viewData['city'], 0, 100) : $this->getCityFromIP($ip),
                    'device_type' => isset($viewData['device_type']) ? substr($viewData['device_type'], 0, 50) : $this->detectDeviceType($userAgent),
                    'browser' => isset($viewData['browser']) ? substr($viewData['browser'], 0, 100) : $this->detectBrowser($userAgent),
                    'os' => isset($viewData['os']) ? substr($viewData['os'], 0, 100) : $this->detectOS($userAgent),
                    'viewed_at' => $viewData['viewed_at'] ?? $now,
                    'created_at' => $now,
                    'updated_at' => $now
                ];

                $viewId = DB::table('boutique_views')->insertGetId($insertData);

                if ($viewId) {
                    $this->updateViewCounters($boutique);
                    
                    Log::info('Vue étendue enregistrée avec succès', [
                        'boutique_id' => $boutique->id,
                        'view_id' => $viewId,
                        'extended' => true
                    ]);
                    
                    return true;
                }
            } else {
                Log::info('Vue étendue déjà enregistrée récemment', [
                    'boutique_id' => $boutique->id,
                    'recent_view_id' => $recentView->id
                ]);
            }

            return false;

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'enregistrement de vue étendu', [
                'boutique_id' => $boutique->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }
    
    /**
     * Récupérer une vue récente
     */
    private function getRecentView($boutique, $ip, $userAgent, $seconds = 1800)
    {
        try {
            return DB::table('boutique_views')
                ->where('boutique_id', $boutique->id)
                ->where('ip_address', $ip)
                ->where('user_agent', $userAgent)
                ->where('viewed_at', '>=', now()->subSeconds($seconds))
                ->orderBy('viewed_at', 'desc')
                ->first();
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération de vue récente', [
                'boutique_id' => $boutique->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Mettre à jour les compteurs de vues
     */
    private function updateViewCounters($boutique)
    {
        try {
            // Compter le total des vues
            $totalViews = DB::table('boutique_views')
                ->where('boutique_id', $boutique->id)
                ->count();

            // Mettre à jour le compteur dans la table boutiques si la colonne existe
            try {
                DB::table('boutiques')
                    ->where('id', $boutique->id)
                    ->update(['total_views' => $totalViews]);
            } catch (\Exception $e) {
                // La colonne total_views n'existe peut-être pas, continuer sans erreur
                Log::info('Colonne total_views non trouvée dans la table boutiques', [
                    'boutique_id' => $boutique->id
                ]);
            }

            // Invalider le cache
            $this->invalidateStatsCache($boutique->id);

            Log::info('Compteurs de vues mis à jour', [
                'boutique_id' => $boutique->id,
                'total_views' => $totalViews
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour des compteurs', [
                'boutique_id' => $boutique->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Détecter le type d'appareil
     */
    private function detectDeviceType($userAgent)
    {
        $userAgent = strtolower($userAgent);
        
        if (preg_match('/mobile|android|iphone|ipad|phone/i', $userAgent)) {
            if (preg_match('/ipad|tablet/i', $userAgent)) {
                return 'tablet';
            }
            return 'mobile';
        } elseif (preg_match('/tablet|ipad/i', $userAgent)) {
            return 'tablet';
        }
        
        return 'desktop';
    }

    /**
     * Détecter le navigateur
     */
    private function detectBrowser($userAgent)
    {
        $browsers = [
            'Chrome' => '/chrome/i',
            'Firefox' => '/firefox/i',
            'Safari' => '/safari/i',
            'Edge' => '/edge/i',
            'Opera' => '/opera/i',
            'Internet Explorer' => '/msie|trident/i'
        ];

        foreach ($browsers as $browser => $pattern) {
            if (preg_match($pattern, $userAgent)) {
                return substr($browser, 0, 100); // Limiter à 100 chars
            }
        }

        return 'Unknown';
    }

    /**
     * Détecter le système d'exploitation
     */
    private function detectOS($userAgent)
    {
        $os_array = [
            'Windows 11' => '/windows nt 10.0.*build 22/i',
            'Windows 10' => '/windows nt 10/i',
            'Windows 8.1' => '/windows nt 6.3/i',
            'Windows 8' => '/windows nt 6.2/i',
            'Windows 7' => '/windows nt 6.1/i',
            'Windows Vista' => '/windows nt 6.0/i',
            'Windows XP' => '/windows nt 5.1/i',
            'Mac OS X' => '/mac os x/i',
            'macOS' => '/macintosh|mac os x/i',
            'Linux' => '/linux/i',
            'Android' => '/android/i',
            'iOS' => '/iphone|ipad|ipod/i',
            'Ubuntu' => '/ubuntu/i'
        ];

        foreach ($os_array as $os => $pattern) {
            if (preg_match($pattern, $userAgent)) {
                return substr($os, 0, 100); // Limiter à 100 chars
            }
        }

        return 'Unknown';
    }

    /**
     * Obtenir le pays à partir de l'IP (à implémenter avec un service externe)
     */
    private function getCountryFromIP($ip)
    {
        // TODO: Implémenter avec un service comme GeoIP, MaxMind, ou une API
        // Pour l'instant, retourner null
        return null;
    }

    /**
     * Obtenir la ville à partir de l'IP (à implémenter avec un service externe)
     */
    private function getCityFromIP($ip)
    {
        // TODO: Implémenter avec un service comme GeoIP, MaxMind, ou une API
        // Pour l'instant, retourner null
        return null;
    }

    /**
     * Obtenir le nombre total de vues d'une boutique
     */
    public function getTotalViews(Boutique $boutique)
    {
        try {
            $cacheKey = "boutique_total_views_{$boutique->id}";
            
            return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($boutique) {
                $count = DB::table('boutique_views')
                    ->where('boutique_id', $boutique->id)
                    ->count();
                    
                Log::info('Comptage des vues depuis la base', [
                    'boutique_id' => $boutique->id,
                    'total_views' => $count
                ]);
                
                return $count;
            });
            
        } catch (\Exception $e) {
            Log::error('Erreur lors du comptage des vues', [
                'boutique_id' => $boutique->id,
                'error' => $e->getMessage()
            ]);
            
            return 0;
        }
    }
    
    /**
     * Obtenir les statistiques de vues pour le dashboard
     */
    public function getViewStats(Boutique $boutique, $period = 'month')
    {
        try {
            $cacheKey = "boutique_view_stats_{$boutique->id}_{$period}";
            
            return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($boutique, $period) {
                $now = Carbon::now();
                
                // Définir les périodes
                switch ($period) {
                    case 'today':
                        $startDate = $now->copy()->startOfDay();
                        $previousStartDate = $now->copy()->subDay()->startOfDay();
                        $previousEndDate = $now->copy()->subDay()->endOfDay();
                        break;
                    case 'week':
                        $startDate = $now->copy()->startOfWeek();
                        $previousStartDate = $now->copy()->subWeek()->startOfWeek();
                        $previousEndDate = $now->copy()->subWeek()->endOfWeek();
                        break;
                    case 'year':
                        $startDate = $now->copy()->startOfYear();
                        $previousStartDate = $now->copy()->subYear()->startOfYear();
                        $previousEndDate = $now->copy()->subYear()->endOfYear();
                        break;
                    default: // month
                        $startDate = $now->copy()->startOfMonth();
                        $previousStartDate = $now->copy()->subMonth()->startOfMonth();
                        $previousEndDate = $now->copy()->subMonth()->endOfMonth();
                        break;
                }
                
                // Vues de la période courante
                $currentViews = DB::table('boutique_views')
                    ->where('boutique_id', $boutique->id)
                    ->where('viewed_at', '>=', $startDate)
                    ->where('viewed_at', '<=', $now)
                    ->count();
                
                // Vues de la période précédente
                $previousViews = DB::table('boutique_views')
                    ->where('boutique_id', $boutique->id)
                    ->where('viewed_at', '>=', $previousStartDate)
                    ->where('viewed_at', '<=', $previousEndDate)
                    ->count();
                
                // Vues uniques (par IP) pour la période courante
                $uniqueViews = DB::table('boutique_views')
                    ->where('boutique_id', $boutique->id)
                    ->where('viewed_at', '>=', $startDate)
                    ->where('viewed_at', '<=', $now)
                    ->distinct('ip_address')
                    ->count('ip_address');
                
                // Calcul du taux de croissance
                $growth = 0;
                if ($previousViews > 0) {
                    $growth = (($currentViews - $previousViews) / $previousViews) * 100;
                }
                
                $stats = [
                    'total_views' => $currentViews,
                    'unique_views' => $uniqueViews,
                    'previous_views' => $previousViews,
                    'growth' => round($growth, 2)
                ];
                
                Log::info('Statistiques calculées', [
                    'boutique_id' => $boutique->id,
                    'period' => $period,
                    'stats' => $stats
                ]);
                
                return $stats;
            });
            
        } catch (\Exception $e) {
            Log::error('Erreur lors du calcul des statistiques', [
                'boutique_id' => $boutique->id,
                'period' => $period,
                'error' => $e->getMessage()
            ]);
            
            return [
                'total_views' => 0,
                'unique_views' => 0,
                'previous_views' => 0,
                'growth' => 0
            ];
        }
    }
    
    /**
     * Obtenir les statistiques complètes avec données pour graphiques
     */
    public function getCompleteStats(Boutique $boutique, $period = 'month')
    {
        try {
            $baseStats = $this->getViewStats($boutique, $period);
            
            // Ajouter des données pour les graphiques
            $chartData = $this->getChartData($boutique, $period);
            
            return array_merge($baseStats, [
                'chart_data' => $chartData,
                'total_unique_visitors' => $this->getTotalUniqueVisitors($boutique),
                'top_referrers' => $this->getTopReferrers($boutique, $period),
                'hourly_distribution' => $this->getHourlyDistribution($boutique, $period)
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors du calcul des statistiques complètes', [
                'boutique_id' => $boutique->id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'total_views' => 0,
                'unique_views' => 0,
                'previous_views' => 0,
                'growth' => 0,
                'chart_data' => [],
                'total_unique_visitors' => 0,
                'top_referrers' => [],
                'hourly_distribution' => []
            ];
        }
    }
    
    /**
     * Obtenir les données pour les graphiques
     */
    private function getChartData(Boutique $boutique, $period)
    {
        $now = Carbon::now();
        
        switch ($period) {
            case 'today':
                return $this->getHourlyChartData($boutique, $now);
            case 'week':
                return $this->getDailyChartData($boutique, $now->copy()->startOfWeek(), 7);
            case 'year':
                return $this->getMonthlyChartData($boutique, $now);
            default: // month
                return $this->getDailyChartData($boutique, $now->copy()->startOfMonth(), 30);
        }
    }
    
    /**
     * Données par heure pour aujourd'hui
     */
    private function getHourlyChartData(Boutique $boutique, Carbon $date)
    {
        $data = [];
        
        for ($hour = 0; $hour < 24; $hour++) {
            $startHour = $date->copy()->startOfDay()->addHours($hour);
            $endHour = $startHour->copy()->addHour();
            
            $count = DB::table('boutique_views')
                ->where('boutique_id', $boutique->id)
                ->where('viewed_at', '>=', $startHour)
                ->where('viewed_at', '<', $endHour)
                ->count();
            
            $data[] = [
                'label' => $startHour->format('H:00'),
                'value' => $count,
                'date' => $startHour->toISOString()
            ];
        }
        
        return $data;
    }
    
    /**
     * Données par jour
     */
    private function getDailyChartData(Boutique $boutique, Carbon $startDate, $days)
    {
        $data = [];
        
        for ($i = 0; $i < $days; $i++) {
            $date = $startDate->copy()->addDays($i);
            $startOfDay = $date->copy()->startOfDay();
            $endOfDay = $date->copy()->endOfDay();
            
            $count = DB::table('boutique_views')
                ->where('boutique_id', $boutique->id)
                ->where('viewed_at', '>=', $startOfDay)
                ->where('viewed_at', '<=', $endOfDay)
                ->count();
            
            $data[] = [
                'label' => $date->format('d/m'),
                'value' => $count,
                'date' => $date->toDateString()
            ];
        }
        
        return $data;
    }
    
    /**
     * Données par mois pour l'année
     */
    private function getMonthlyChartData(Boutique $boutique, Carbon $year)
    {
        $data = [];
        
        for ($month = 1; $month <= 12; $month++) {
            $startOfMonth = $year->copy()->month($month)->startOfMonth();
            $endOfMonth = $year->copy()->month($month)->endOfMonth();
            
            $count = DB::table('boutique_views')
                ->where('boutique_id', $boutique->id)
                ->where('viewed_at', '>=', $startOfMonth)
                ->where('viewed_at', '<=', $endOfMonth)
                ->count();
            
            $data[] = [
                'label' => $startOfMonth->format('M'),
                'value' => $count,
                'date' => $startOfMonth->toDateString()
            ];
        }
        
        return $data;
    }
    
    /**
     * Nombre total de visiteurs uniques
     */
    private function getTotalUniqueVisitors(Boutique $boutique)
    {
        return DB::table('boutique_views')
            ->where('boutique_id', $boutique->id)
            ->distinct('ip_address')
            ->count('ip_address');
    }
    
    /**
     * Top des référents
     */
    private function getTopReferrers(Boutique $boutique, $period)
    {
        $startDate = $this->getStartDateForPeriod($period);
        
        return DB::table('boutique_views')
            ->where('boutique_id', $boutique->id)
            ->where('viewed_at', '>=', $startDate)
            ->whereNotNull('referrer')
            ->select('referrer', DB::raw('count(*) as count'))
            ->groupBy('referrer')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get();
    }
    
    /**
     * Distribution par heure
     */
    private function getHourlyDistribution(Boutique $boutique, $period)
    {
        $startDate = $this->getStartDateForPeriod($period);
        
        return DB::table('boutique_views')
            ->where('boutique_id', $boutique->id)
            ->where('viewed_at', '>=', $startDate)
            ->select(DB::raw('HOUR(viewed_at) as hour'), DB::raw('count(*) as count'))
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();
    }
    
    /**
     * Obtenir la date de début pour une période
     */
    private function getStartDateForPeriod($period)
    {
        $now = Carbon::now();
        
        switch ($period) {
            case 'today':
                return $now->copy()->startOfDay();
            case 'week':
                return $now->copy()->startOfWeek();
            case 'year':
                return $now->copy()->startOfYear();
            default: // month
                return $now->copy()->startOfMonth();
        }
    }
    
    /**
     * Invalider le cache des statistiques
     */
    private function invalidateStatsCache($boutiqueId)
    {
        $keys = [
            "boutique_total_views_{$boutiqueId}",
            "boutique_view_stats_{$boutiqueId}_today",
            "boutique_view_stats_{$boutiqueId}_week", 
            "boutique_view_stats_{$boutiqueId}_month",
            "boutique_view_stats_{$boutiqueId}_year"
        ];
        
        foreach ($keys as $key) {
            Cache::forget($key);
        }
    }
    
    /**
     * Nettoyer les anciennes vues (à exécuter périodiquement)
     */
    public function cleanOldViews($daysToKeep = 365)
    {
        try {
            $cutoffDate = Carbon::now()->subDays($daysToKeep);
            
            $deleted = DB::table('boutique_views')
                ->where('viewed_at', '<', $cutoffDate)
                ->delete();
            
            Log::info('Nettoyage des anciennes vues', [
                'deleted_count' => $deleted,
                'cutoff_date' => $cutoffDate->toISOString()
            ]);
            
            return $deleted;
            
        } catch (\Exception $e) {
            Log::error('Erreur lors du nettoyage des vues', [
                'error' => $e->getMessage()
            ]);
            
            return 0;
        }
    }
}