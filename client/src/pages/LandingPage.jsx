import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Ticket, Users, Shield, Clock, CheckCircle, MessageSquare, 
  BarChart3, Settings, ArrowRight
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Ticket className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Ticket Manager</span>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900">About</a>
              <Link to="/login" className="btn btn-secondary">Sign In</Link>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-blue-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Streamline Your
              <span className="text-primary-600"> Support Workflow</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Professional role-based ticket management system designed for teams who value 
              efficiency, security, and exceptional customer service.
            </p>
            <div className="flex justify-center">
              <Link to="/register" className="btn btn-primary btn-lg">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">&lt; 2min</div>
              <div className="text-gray-600">Average Response</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">500+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">24/7</div>
              <div className="text-gray-600">Support Available</div>
            </div>
          </div>
        </div>
      </section>
      {/* Customer Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for <span className="text-primary-600">Customers</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get the support you need with our intuitive customer portal designed for ease of use and transparency.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Ticket className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Easy Ticket Creation</h3>
              <p className="text-gray-600 mb-4">
                Submit support requests with detailed descriptions, priority levels, and file attachments in seconds.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Quick form submission</li>
                <li>• Priority selection</li>
                <li>• Category tagging</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Updates</h3>
              <p className="text-gray-600 mb-4">
                Get instant notifications when your tickets are updated, assigned, or resolved by our support team.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Email notifications</li>
                <li>• Status tracking</li>
                <li>• Progress updates</li>
                <li>• Resolution alerts</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Direct Communication</h3>
              <p className="text-gray-600 mb-4">
                Chat directly with support agents through ticket comments and receive personalized assistance.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Two-way messaging</li>
                <li>• Agent responses</li>
                <li>• Comment history</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Track Progress</h3>
              <p className="text-gray-600 mb-4">
                Monitor your ticket status, view resolution history, and access detailed progress reports.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Status dashboard</li>
                <li>• History tracking</li>
                <li>• Resolution metrics</li>
                <li>• Performance insights</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      {/* Agent Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Tools for <span className="text-primary-600">Support Teams</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Empower your support agents with advanced tools and role-based access control for maximum efficiency.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Role-Based Access</h3>
              <p className="text-gray-600 mb-4">
                Secure access control with Admin, Manager, Agent, and Customer roles for organized workflow management.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Hierarchical permissions</li>
                <li>• Role-specific dashboards</li>
                <li>• Secure access control</li>
                <li>• Team organization</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Assignment</h3>
              <p className="text-gray-600 mb-4">
                Managers assign tickets to agents who can accept or reject based on workload and expertise.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Manager oversight</li>
                <li>• Agent acceptance system</li>
                <li>• Workload balancing</li>
                <li>• Expertise matching</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Workflow Management</h3>
              <p className="text-gray-600 mb-4">
                Streamlined ticket lifecycle from creation to resolution with status tracking and priority management.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Status automation</li>
                <li>• Priority handling</li>
                <li>• Lifecycle tracking</li>
                <li>• Resolution workflows</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Advanced Analytics</h3>
              <p className="text-gray-600 mb-4">
                Comprehensive dashboard, reporting tools, and customizable settings for efficient support operations.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Performance analytics</li>
                <li>• Custom reports</li>
                <li>• Team metrics</li>
                <li>• System configuration</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Support?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of teams who trust Ticket Manager to deliver exceptional customer support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg">
              Start Free Trial
            </Link>
            <Link to="/login" className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 btn-lg">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Ticket Manager</span>
              </div>
              <p className="text-gray-400">
                Professional support ticket management for modern teams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#security" className="hover:text-white">Security</a></li>
                <li><a href="#integrations" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white">About</a></li>
                <li><a href="#careers" className="hover:text-white">Careers</a></li>
                <li><a href="#contact" className="hover:text-white">Contact</a></li>
                <li><a href="#blog" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#help" className="hover:text-white">Help Center</a></li>
                <li><a href="#docs" className="hover:text-white">Documentation</a></li>
                <li><a href="#api" className="hover:text-white">API Reference</a></li>
                <li><a href="#status" className="hover:text-white">System Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Ticket Manager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;