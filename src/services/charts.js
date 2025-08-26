import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import moment from 'moment';
import { logger } from '../utils/logger.js';

export class ChartService {
    constructor() {
        this.width = 800;
        this.height = 600;
        this.chartJSNodeCanvas = new ChartJSNodeCanvas({
            width: this.width,
            height: this.height,
            backgroundColour: '#1a1a1a',
            chartCallback: (ChartJS) => {
                ChartJS.defaults.color = '#ffffff';
                ChartJS.defaults.borderColor = '#404040';
                ChartJS.defaults.backgroundColor = 'rgba(75, 192, 192, 0.2)';
            }
        });
    }

    async generateMetricChart(metricName, data, config = {}) {
        try {
            const chartConfig = this.getChartConfig(metricName, data, config);
            const buffer = await this.chartJSNodeCanvas.renderToBuffer(chartConfig);
            return buffer;
        } catch (error) {
            logger.error(`Error generating chart for ${metricName}:`, error);
            throw error;
        }
    }

    getChartConfig(metricName, data, config) {
        const labels = data.map(item => moment(item.timestamp).format('MMM DD HH:mm'));
        const values = data.map(item => parseFloat(item.value));
        
        const metricConfig = this.getMetricSpecificConfig(metricName);
        
        return {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: metricConfig.label,
                    data: values,
                    borderColor: metricConfig.borderColor,
                    backgroundColor: metricConfig.backgroundColor,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: metricConfig.pointColor,
                    pointBorderColor: metricConfig.borderColor,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${metricConfig.title} - ${this.getTimeRange(data)}`,
                        color: '#ffffff',
                        font: {
                            size: 20,
                            weight: 'bold'
                        },
                        padding: 20
                    },
                    legend: {
                        display: true,
                        labels: {
                            color: '#ffffff',
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: metricConfig.borderColor,
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                return moment(data[context[0].dataIndex].timestamp).format('MMMM DD, YYYY HH:mm');
                            },
                            label: function(context) {
                                const value = context.parsed.y;
                                const interpretation = metricConfig.getInterpretation ? 
                                    metricConfig.getInterpretation(value) : '';
                                return `${metricConfig.label}: ${value.toFixed(2)} ${interpretation}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time',
                            color: '#ffffff',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            color: '#cccccc',
                            maxTicksLimit: 10
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: metricConfig.yAxisLabel || metricConfig.label,
                            color: '#ffffff',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            color: '#cccccc'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            },
            plugins: [{
                id: 'thresholdLines',
                beforeDraw: (chart) => {
                    this.drawThresholdLines(chart, metricName, metricConfig);
                }
            }]
        };
    }

    drawThresholdLines(chart, metricName, metricConfig) {
        const { ctx, chartArea: { top, bottom, left, right }, scales: { y } } = chart;
        
        if (!metricConfig.thresholds) return;
        
        ctx.save();
        
        Object.entries(metricConfig.thresholds).forEach(([key, value]) => {
            if (typeof value === 'number') {
                const yPosition = y.getPixelForValue(value);
                
                if (yPosition >= top && yPosition <= bottom) {
                    const color = this.getThresholdColor(key);
                    const label = this.getThresholdLabel(key);
                    
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    
                    ctx.beginPath();
                    ctx.moveTo(left, yPosition);
                    ctx.lineTo(right, yPosition);
                    ctx.stroke();
                    
                    ctx.fillStyle = color;
                    ctx.font = 'bold 12px Arial';
                    ctx.fillText(label, right - 100, yPosition - 5);
                }
            }
        });
        
        ctx.restore();
    }

    getThresholdColor(thresholdType) {
        const colors = {
            warning: '#FFA500',
            danger: '#FF4500',
            panic: '#FF0000',
            fear: '#FF6347',
            greed: '#32CD32',
            oversold: '#00FF00',
            overbought: '#FF0000',
            opportunity: '#00CED1',
            crisis: '#DC143C',
            extreme: '#8B0000'
        };
        
        return colors[thresholdType] || '#FFFF00';
    }

    getThresholdLabel(thresholdType) {
        const labels = {
            warning: 'Warning',
            danger: 'Danger',
            panic: 'Panic',
            fear: 'Fear',
            greed: 'Greed',
            oversold: 'Oversold',
            overbought: 'Overbought',
            opportunity: 'Opportunity',
            crisis: 'Crisis',
            extreme: 'Extreme'
        };
        
        return labels[thresholdType] || thresholdType.toUpperCase();
    }

    getMetricSpecificConfig(metricName) {
        const configs = {
            vix: {
                title: 'VIX - CBOE Volatility Index',
                label: 'VIX',
                borderColor: '#FF6B35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                pointColor: '#FF6B35',
                yAxisLabel: 'Volatility Index',
                thresholds: { warning: 20, danger: 30, panic: 40 },
                getInterpretation: (value) => {
                    if (value > 40) return '(PANIC)';
                    if (value > 30) return '(FEAR)';
                    if (value > 20) return '(ELEVATED)';
                    if (value < 15) return '(COMPLACENT)';
                    return '(NORMAL)';
                }
            },
            cape: {
                title: 'Shiller CAPE Ratio',
                label: 'CAPE',
                borderColor: '#4ECDC4',
                backgroundColor: 'rgba(78, 205, 196, 0.1)',
                pointColor: '#4ECDC4',
                yAxisLabel: 'P/E Ratio',
                thresholds: { overvalued: 25, bubble: 35 }
            },
            spyRsi: {
                title: 'S&P 500 RSI',
                label: 'RSI',
                borderColor: '#45B7D1',
                backgroundColor: 'rgba(69, 183, 209, 0.1)',
                pointColor: '#45B7D1',
                yAxisLabel: 'RSI Value',
                thresholds: { oversold: 30, overbought: 70, extreme: 20 },
                getInterpretation: (value) => {
                    if (value < 20) return '(EXTREME OVERSOLD)';
                    if (value < 30) return '(OVERSOLD)';
                    if (value > 70) return '(OVERBOUGHT)';
                    return '(NORMAL)';
                }
            },
            putCallRatio: {
                title: 'Put/Call Ratio',
                label: 'Put/Call',
                borderColor: '#F7DC6F',
                backgroundColor: 'rgba(247, 220, 111, 0.1)',
                pointColor: '#F7DC6F',
                yAxisLabel: 'Ratio',
                thresholds: { fear: 1.0, panic: 1.5, extreme: 2.0 }
            },
            fearGreedIndex: {
                title: 'CNN Fear & Greed Index',
                label: 'Fear & Greed',
                borderColor: '#BB8FCE',
                backgroundColor: 'rgba(187, 143, 206, 0.1)',
                pointColor: '#BB8FCE',
                yAxisLabel: 'Index (0-100)',
                thresholds: { fear: 20, greed: 80 }
            },
            mcclellanOscillator: {
                title: 'McClellan Oscillator',
                label: 'McClellan',
                borderColor: '#58D68D',
                backgroundColor: 'rgba(88, 214, 141, 0.1)',
                pointColor: '#58D68D',
                yAxisLabel: 'Oscillator Value',
                thresholds: { oversold: -100, capitulation: -150 }
            },
            highLowIndex: {
                title: 'High-Low Index',
                label: 'High-Low',
                borderColor: '#F1948A',
                backgroundColor: 'rgba(241, 148, 138, 0.1)',
                pointColor: '#F1948A',
                yAxisLabel: 'Index Value',
                thresholds: { weakness: -0.5, capitulation: -0.8 }
            },
            yieldSpread: {
                title: '10Y-2Y Treasury Spread',
                label: 'Yield Spread',
                borderColor: '#85C1E9',
                backgroundColor: 'rgba(133, 193, 233, 0.1)',
                pointColor: '#85C1E9',
                yAxisLabel: 'Spread (%)',
                thresholds: { inversion: 0 }
            },
            dollarIndex: {
                title: 'US Dollar Index (DXY)',
                label: 'DXY',
                borderColor: '#D5A6BD',
                backgroundColor: 'rgba(213, 166, 189, 0.1)',
                pointColor: '#D5A6BD',
                yAxisLabel: 'Index Value',
                thresholds: { strong: 110, weak: 95 }
            },
            nvdaPE: {
                title: 'NVIDIA P/E Ratio',
                label: 'NVDA P/E',
                borderColor: '#76D7C4',
                backgroundColor: 'rgba(118, 215, 196, 0.1)',
                pointColor: '#76D7C4',
                yAxisLabel: 'P/E Ratio'
            }
        };

        return configs[metricName] || {
            title: metricName.toUpperCase(),
            label: metricName,
            borderColor: '#FFFFFF',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            pointColor: '#FFFFFF',
            yAxisLabel: 'Value'
        };
    }

    async generateMultiMetricChart(metricsData, title = 'Market Overview') {
        try {
            const chartConfig = {
                type: 'line',
                data: {
                    labels: this.generateTimeLabels(metricsData),
                    datasets: Object.keys(metricsData).map((metricName, index) => {
                        const config = this.getMetricSpecificConfig(metricName);
                        const data = metricsData[metricName];
                        
                        return {
                            label: config.label,
                            data: data.map(item => parseFloat(item.value)),
                            borderColor: config.borderColor,
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.4,
                            pointRadius: 2,
                            pointHoverRadius: 4,
                            yAxisID: index < 2 ? 'y' : 'y1'
                        };
                    })
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: title,
                            color: '#ffffff',
                            font: {
                                size: 20,
                                weight: 'bold'
                            }
                        },
                        legend: {
                            display: true,
                            labels: {
                                color: '#ffffff'
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Time',
                                color: '#ffffff'
                            },
                            ticks: {
                                color: '#cccccc'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Primary Metrics',
                                color: '#ffffff'
                            },
                            ticks: {
                                color: '#cccccc'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Secondary Metrics',
                                color: '#ffffff'
                            },
                            ticks: {
                                color: '#cccccc'
                            },
                            grid: {
                                drawOnChartArea: false,
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            };

            const buffer = await this.chartJSNodeCanvas.renderToBuffer(chartConfig);
            return buffer;
        } catch (error) {
            logger.error('Error generating multi-metric chart:', error);
            throw error;
        }
    }

    async generateAlertLevelChart(alertHistory) {
        try {
            const labels = alertHistory.map(item => moment(item.timestamp).format('MMM DD HH:mm'));
            const levels = alertHistory.map(item => this.alertLevelToNumber(item.level));
            const colors = alertHistory.map(item => this.getAlertLevelColor(item.level));

            const chartConfig = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Alert Level',
                        data: levels,
                        borderColor: '#FF6B35',
                        backgroundColor: levels.map((level, index) => colors[index]),
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: colors,
                        pointBorderColor: '#FF6B35',
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Market Alert Level History',
                            color: '#ffffff',
                            font: {
                                size: 20,
                                weight: 'bold'
                            }
                        }
                    },
                    scales: {
                        y: {
                            min: 0,
                            max: 4,
                            ticks: {
                                stepSize: 1,
                                callback: function(value) {
                                    const levels = ['', 'GREEN', 'YELLOW', 'ORANGE', 'RED'];
                                    return levels[value];
                                },
                                color: '#cccccc'
                            },
                            title: {
                                display: true,
                                text: 'Alert Level',
                                color: '#ffffff'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#cccccc'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            };

            const buffer = await this.chartJSNodeCanvas.renderToBuffer(chartConfig);
            return buffer;
        } catch (error) {
            logger.error('Error generating alert level chart:', error);
            throw error;
        }
    }

    alertLevelToNumber(level) {
        const mapping = {
            'GREEN': 1,
            'YELLOW': 2,
            'ORANGE': 3,
            'RED': 4
        };
        return mapping[level] || 0;
    }

    getAlertLevelColor(level) {
        const colors = {
            'GREEN': 'rgba(0, 255, 0, 0.3)',
            'YELLOW': 'rgba(255, 255, 0, 0.3)',
            'ORANGE': 'rgba(255, 165, 0, 0.3)',
            'RED': 'rgba(255, 0, 0, 0.3)'
        };
        return colors[level] || 'rgba(128, 128, 128, 0.3)';
    }

    generateTimeLabels(metricsData) {
        const firstMetric = Object.values(metricsData)[0];
        return firstMetric ? firstMetric.map(item => moment(item.timestamp).format('MMM DD HH:mm')) : [];
    }

    getTimeRange(data) {
        if (!data || data.length === 0) return 'No data';
        
        const start = moment(data[0].timestamp);
        const end = moment(data[data.length - 1].timestamp);
        
        return `${start.format('MMM DD')} - ${end.format('MMM DD')}`;
    }

    async generateCorrelationHeatmap(correlationMatrix) {
        // This would be implemented with a heatmap chart for metric correlations
        // For now, returning a placeholder
        return Buffer.from('Correlation heatmap placeholder');
    }
}