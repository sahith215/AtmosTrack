import React from 'react';
import { Wind, MapPin, Activity, TrendingUp, ArrowRight, Play } from 'lucide-react';

interface HomeProps {
  setActiveView: (view: string) => void;
}

const Home: React.FC<HomeProps> = ({ setActiveView }) => {
  const handleNavigateToDashboard = () => {
    setActiveView('dashboard');
  };

  const handleNavigateToMap = () => {
    setActiveView('map');
  };

  const features = [
    {
      icon: MapPin,
      title: 'Interactive Mapping',
      description: 'Explore air quality data across India with our interactive map interface',
      color: 'from-blue-400 to-blue-500'
    },
    {
      icon: Activity,
      title: 'Real-time Monitoring',
      description: 'Get live updates on air quality metrics and pollution levels',
      color: 'from-green-400 to-green-500'
    },
    {
      icon: TrendingUp,
      title: 'Health Insights',
      description: 'Receive personalized health recommendations based on air quality',
      color: 'from-purple-400 to-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-orange-50 pt-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center transform transition-all duration-1000 translate-y-0 opacity-100">
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-orange-100 rounded-full text-orange-700 font-medium text-sm mb-6 animate-fade-in">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse"></div>
                Live Air Quality Monitoring
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
                Breathe
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600"> Smarter</span>
                <br />
                Live Better
              </h1>
              
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                Monitor urban air quality in real-time across India. Get comprehensive pollution data, 
                health insights, and environmental analytics to make informed decisions about your daily life.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button 
                onClick={handleNavigateToDashboard}
                className="group bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
              >
                <Play className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
                Explore Dashboard
              </button>
              <button 
                onClick={handleNavigateToMap}
                className="group bg-white/80 backdrop-blur-md text-gray-700 px-8 py-4 rounded-2xl font-semibold border border-cream-200 hover:border-orange-200 hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
              >
                View Map
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>

            {/* Current AQI Display */}
            
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-orange-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-cream-300 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-orange-300 rounded-full opacity-25 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Comprehensive Air Quality Intelligence
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Advanced monitoring technology meets intuitive design to deliver actionable environmental insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`group bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-cream-200 hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-fade-in`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-cream-100 to-orange-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-12 shadow-xl border border-cream-200">
            <Wind className="h-16 w-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Start Monitoring Today
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of users who rely on AtmosTrack for accurate, real-time air quality data and health insights.
            </p>
            <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-10 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              Get Started Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
