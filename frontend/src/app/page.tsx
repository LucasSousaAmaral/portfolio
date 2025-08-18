"use client"

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  MapPin, 
  Github, 
  Linkedin, 
  Code, 
  Database, 
  Cloud, 
  Settings, 
  TestTube, 
  Building, 
  Menu,
  X,
  Globe,
  Brush
} from 'lucide-react';

export default function Homepage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'skills', 'contact'];
      const scrollPosition = window.scrollY + 100;

      sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const height = element.offsetHeight;
          
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + height) {
            setActiveSection(section);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/95 backdrop-blur-sm z-50 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="text-xl font-bold text-cyan-400">LA</div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              {[
                { id: 'home', label: 'Home' },
                { id: 'about', label: 'Sobre' },
                { id: 'skills', label: 'Skills' },
                { id: 'contact', label: 'Contato' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`transition-colors duration-300 ${
                    activeSection === id 
                      ? 'text-cyan-400' 
                      : 'text-gray-400 hover:text-cyan-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden bg-gray-900 border-t border-gray-800">
              {[
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'Sobre' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projetos' },
  { id: 'contact', label: 'Contato' }
].map(({ id, label }) => (
  <button
    key={id}
    onClick={() => id === 'projects' ? window.location.href = '/projects' : scrollToSection(id)}
    className={`transition-colors duration-300 ${
      activeSection === id 
        ? 'text-cyan-400' 
        : 'text-gray-400 hover:text-cyan-400'
    }`}
  >
    {label}
  </button>
))}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-black to-gray-900">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="#333333" stroke-width="0.5" opacity="0.3"/></pattern></defs><rect width="100" height="100" fill="url(#grid)"/></svg>')}")`
          }} />
        </div>
        
        <div className="text-center z-10 max-w-4xl px-4">
          <p className="text-cyan-400 text-lg mb-4 font-medium">
            Senior .NET Engineer & Backend Architect
          </p>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
            Lucas Amaral
          </h1>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
            Especialista em arquiteturas backend escaláveis com .NET e AWS Cloud. 
            Mais de 5 anos construindo sistemas enterprise com DDD, CQRS e Clean Architecture.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => scrollToSection('contact')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Mail size={20} />
              Entre em Contato
            </button>
            <a
              href="https://github.com/LucasSousaAmaral"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:border-cyan-400 hover:text-cyan-400 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Github size={20} />
              Ver Projetos
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Sobre Mim</h2>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Sou um Senior .NET Engineer & Backend Architect com sólida experiência em 
                desenvolvimento de sistemas escaláveis e arquiteturas enterprise. Atualmente 
                trabalhando na Gertec, lidero projetos de redesign de sistemas críticos 
                utilizando Domain-Driven Design e CQRS.
              </p>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Minha especialização inclui desenvolvimento backend com .NET 8, integração 
                com serviços AWS, e implementação de arquiteturas limpas que garantem 
                escalabilidade e manutenibilidade. Tenho experiência comprovada em liderar 
                equipes e mentorar desenvolvedores.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                {[
                  { number: '5+', label: 'Anos de Experiência' },
                  { number: '50+', label: 'Projetos Entregues' },
                  { number: '10+', label: 'Tecnologias' },
                  { number: '3', label: 'Setores (Banking, Health, Logistics)' }
                ].map((stat, index) => (
                  <div key={index} className="text-center p-6 bg-gray-800 rounded-xl border border-gray-700">
                    <div className="text-3xl font-bold text-cyan-400 mb-2">{stat.number}</div>
                    <div className="text-gray-400 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="w-80 h-96 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <img 
                  src="/images/pp.jpeg" 
                  alt="Lucas Amaral - Senior .NET Engineer" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image doesn't exist
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center">
                        <div class="text-center">
                          <div class="text-6xl mb-4">👨‍💻</div>
                          <p class="text-gray-400">Lucas Amaral</p>
                        </div>
                      </div>
                    `;
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Habilidades Técnicas</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Code size={24} />,
                title: 'Backend & APIs',
                skills: ['C#', '.NET 8', 'ASP.NET Core', 'Minimal APIs', 'EF Core', 'Dapper', 'LINQ', 'T-SQL']
              },
              {
                icon: <Brush size={24} />,
                title: 'Frontend & UI',
                skills: ['Next.js 15', 'React 19', 'Angular 20', 'TypeScript 5.8', 'Tailwind CSS v4', 'PrimeNG', 'shadcn/ui', 'SCSS/Sass', 'WPF']
              },
              {
                icon: <Building size={24} />,
                title: 'Arquitetura',
                skills: ['Domain-Driven Design', 'CQRS', 'Clean Architecture', 'Microservices', 'REST APIs', 'Event Sourcing']
              },
              {
                icon: <Database size={24} />,
                title: 'Dados & Storage',
                skills: ['DynamoDB', 'SQL Server', 'PostgreSQL', 'Oracle', 'Amazon S3', 'PL/SQL', 'GSI']
              },
              {
                icon: <Cloud size={24} />,
                title: 'AWS & Cloud',
                skills: ['AWS Lambda', 'API Gateway', 'CloudFront', 'Route 53', 'ACM', 'AWS Cognito', 'Secrets Manager', 'CloudWatch']
              },
              {
                icon: <Settings size={24} />,
                title: 'DevOps & IaC',
                skills: ['Terraform', 'GitHub Actions', 'AWS OIDC', 'CI/CD Pipelines', 'Docker', 'Git', 'Cache Strategies']
              },
              {
                icon: <TestTube size={24} />,
                title: 'Testes & Qualidade',
                skills: ['xUnit', 'Integration Testing', 'Selenium WebDriver', 'Code Reviews', 'Clean Code', 'HSTS', 'Security Headers']
              },
              {
                icon: <Globe size={24} />, // You'll need to import Globe from lucide-react
                title: 'Comunicação Global',
                skills: ['English (Fluent)', 'Cross-cultural Communication', 'Remote Collaboration', 'International Projects', 'Multi-timezone Coordination']
              }
            ].map((category, index) => (
              <div key={index} className="bg-gray-900 p-6 rounded-xl border border-gray-700 hover:border-cyan-400 transition-all duration-300 hover:transform hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-cyan-400">{category.icon}</div>
                  <h3 className="text-xl font-semibold text-cyan-400">{category.title}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm border border-gray-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Vamos Conversar</h2>
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-cyan-400 mb-6">Entre em Contato</h3>
            <p className="text-gray-300 text-lg mb-12 leading-relaxed max-w-2xl mx-auto">
              Estou sempre aberto para discutir oportunidades interessantes, 
              projetos desafiadores ou simplesmente trocar ideias sobre tecnologia.
              Entre em contato através dos canais abaixo.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {[
                { 
                  icon: <Mail size={28} />, 
                  title: 'Email',
                  text: 'lucasdovah@gmail.com', 
                  href: 'mailto:lucasdovah@gmail.com',
                  description: 'Respondo em até 24h'
                },
                { 
                  icon: <Linkedin size={28} />, 
                  title: 'LinkedIn',
                  text: 'lucas-sousa-amaral', 
                  href: 'https://www.linkedin.com/in/lucas-sousa-amaral/',
                  description: 'Conecte-se comigo'
                },
                { 
                  icon: <Github size={28} />, 
                  title: 'GitHub',
                  text: 'LucasSousaAmaral', 
                  href: 'https://github.com/LucasSousaAmaral',
                  description: 'Veja meus projetos'
                },
                { 
                  icon: <MapPin size={28} />, 
                  title: 'Localização',
                  text: 'São Paulo, Brasil',
                  description: 'Aberto a trabalho remoto'
                }
              ].map((item, index) => (
                <div key={index} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-cyan-400 transition-all duration-300 hover:transform hover:-translate-y-1 text-center">
                  <div className="text-cyan-400 mb-4 flex justify-center">{item.icon}</div>
                  <h4 className="text-lg font-semibold text-white mb-3">{item.title}</h4>
                  {item.href ? (
                    <a
                      href={item.href}
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors duration-300 font-medium block mb-2 break-words"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-cyan-400 font-medium block mb-2">{item.text}</span>
                  )}
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-gray-400">
            © 2025 Lucas Amaral. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}