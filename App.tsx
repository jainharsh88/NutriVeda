import React, { useState, useEffect } from 'react';
import { CuisineType, Recipe, ViewState, ShoppingItem, UserPreferences, DietType } from './types';
import { MOCK_RECIPES, INITIAL_USER } from './constants';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetail } from './components/RecipeDetail';
import { AIRecommendation } from './components/AIRecommendation';
import { Auth } from './components/Auth';
import { UserProfile } from './components/UserProfile';
import { supabase } from './services/supabaseClient';
import { db } from './services/db';
import { LayoutDashboard, ShoppingCart, Heart, ChefHat, Trash2, Check, Menu, X, Copy, Settings, Search, LogOut, User, Flame } from 'lucide-react';

// Helper to generate a valid UUID v4
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const App = () => {
  // --- Auth State ---
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // --- App State ---
  const [activeView, setActiveView] = useState<ViewState>('recommend');
  const [recipes, setRecipes] = useState<Recipe[]>(MOCK_RECIPES);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [user, setUser] = useState<UserPreferences>(INITIAL_USER);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shoppingListCopied, setShoppingListCopied] = useState(false);

  // Helper to get real user ID
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  const isGuest = !userId || userEmail === 'guest@nutriveda.app';

  // --- Initialization ---
  useEffect(() => {
    if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoadingSession(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    } else {
        setLoadingSession(false);
    }
  }, []);

  // --- Load User Data from DB ---
  useEffect(() => {
    const loadUserData = async () => {
        if (!userId || isGuest) {
            setRecipes(MOCK_RECIPES); // Reset or Keep Mocks for Guest
            setShoppingList([]); // Clear previous user list
            return;
        }

        try {
            // 1. Fetch Profile
            // If profile doesn't exist yet (race condition with trigger), it returns null and we keep default
            const profile = await db.getProfile(userId);
            if (profile) {
                setUser(prev => ({ ...prev, ...profile }));
            }

            // 2. Fetch Saved Recipes
            const savedRecipes = await db.getSavedRecipes(userId);
            
            // Merge saved recipes into the main list
            // We keep MOCK_RECIPES as a base for "Discovery", but update their favorite status
            // AND append any AI generated recipes that were saved.
            const mergedRecipes = [...MOCK_RECIPES].map(r => {
                const isSaved = savedRecipes.find(sr => sr.id === r.id);
                return isSaved ? { ...r, isFavorite: true } : { ...r, isFavorite: false };
            });

            // Add saved recipes that are NOT in mock list (e.g. AI generated ones)
            savedRecipes.forEach(sr => {
                if (!mergedRecipes.find(mr => mr.id === sr.id)) {
                    mergedRecipes.push(sr);
                }
            });

            setRecipes(mergedRecipes);

            // 3. Fetch Shopping List
            const list = await db.getShoppingList(userId);
            setShoppingList(list);

        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setDataLoaded(true);
        }
    };

    if (userId) {
        loadUserData();
    }
  }, [userId, isGuest]);


  // --- Handlers ---
  const handleLogout = async () => {
      if (supabase) await supabase.auth.signOut();
      setSession(null);
      setRecipes(MOCK_RECIPES);
      setShoppingList([]);
      setActiveView('recommend');
  };

  const handleUpdateProfile = async (updatedUser: UserPreferences) => {
      setUser(updatedUser);
      if (!isGuest && userId) {
          await db.updateProfile(userId, updatedUser);
      }
  };

  const handleToggleFavorite = async (id: string) => {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;

    const newStatus = !recipe.isFavorite;

    // Optimistic Update
    setRecipes(prev => prev.map(r => 
      r.id === id ? { ...r, isFavorite: newStatus } : r
    ));

    // DB Update
    if (!isGuest && userId) {
        if (newStatus) {
            await db.addFavorite(userId, recipe);
        } else {
            await db.removeFavorite(userId, id);
        }
    }
  };

  const handleAddToShoppingList = async (recipe: Recipe) => {
    // Generate valid UUIDs to prevent database type errors
    const newItems: ShoppingItem[] = recipe.ingredients.map((ing) => ({
      ...ing,
      id: generateUUID(),
      checked: false,
      recipeName: recipe.name
    }));

    // Optimistic
    setShoppingList(prev => [...prev, ...newItems]);
    
    // NOTE: Alert removed here to use the button animation in RecipeDetail instead

    // DB
    if (!isGuest && userId) {
        for (const item of newItems) {
            await db.addShoppingItem(userId, item);
        }
    }
  };

  const handleToggleShoppingItem = async (id: string) => {
    const item = shoppingList.find(i => i.id === id);
    if (!item) return;

    // Optimistic
    setShoppingList(prev => prev.map(i => 
      i.id === id ? { ...i, checked: !i.checked } : i
    ));

    // DB
    if (!isGuest && userId) {
        await db.updateShoppingItem(userId, id, { checked: !item.checked });
    }
  };

  const handleRemoveShoppingItem = async (id: string) => {
    // Optimistic
    setShoppingList(prev => prev.filter(item => item.id !== id));

    // DB
    if (!isGuest && userId) {
        await db.deleteShoppingItem(userId, id);
    }
  };

  const handleClearShoppingList = async () => {
    if(confirm('Are you sure you want to clear the shopping list?')) {
        setShoppingList([]);
        if (!isGuest && userId) {
            await db.clearShoppingList(userId);
        }
    }
  };
  
  const handleCopyShoppingList = () => {
    const text = "My Shopping List:\n\n" + shoppingList.map(item => 
        `- [${item.checked ? 'x' : ' '}] ${item.name} (${item.quantity}) ${item.recipeName ? `[${item.recipeName}]` : ''}`
    ).join('\n');
    navigator.clipboard.writeText(text);
    setShoppingListCopied(true);
    setTimeout(() => setShoppingListCopied(false), 2000);
  };

  // --- Filtering Logic ---
  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.healthTags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          r.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = selectedCuisine === 'All' || r.cuisine === selectedCuisine;
    const matchesView = activeView === 'kitchen' ? r.isFavorite : true;
    
    return matchesSearch && matchesCuisine && matchesView;
  });

  // --- Nav Helper ---
  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => {
        setActiveView(view);
        setMobileMenuOpen(false);
      }}
      className={`relative flex items-center space-x-2 px-5 py-2.5 rounded-full transition-all duration-300 w-full sm:w-auto font-medium text-sm tracking-wide
        ${activeView === view 
          ? 'bg-charcoal text-white shadow-lg shadow-charcoal/20' 
          : 'text-stone-500 hover:bg-stone-100 hover:text-charcoal'}`}
    >
      <Icon className={`w-4 h-4 ${activeView === view ? 'text-spice' : ''}`} />
      <span>{label}</span>
    </button>
  );

  // --- Render Auth or App ---
  
  if (loadingSession) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-cream">
              <div className="animate-spin text-spice">
                <Flame className="w-12 h-12" />
              </div>
          </div>
      );
  }

  // Gate content behind Auth
  if (!session) {
      return <Auth onContinueAsGuest={() => setSession({ user: { email: 'guest@nutriveda.app' } })} />;
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans selection:bg-spice selection:text-white">
      
      {/* Floating Navigation Bar */}
      <nav className="fixed top-4 left-0 right-0 z-40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl shadow-soft border border-white/50 px-6 h-20 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center cursor-pointer group" onClick={() => setActiveView('recommend')}>
              <div className="mr-3 text-spice transition-transform group-hover:scale-110 duration-500">
                <Flame className="w-7 h-7 fill-spice/10" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-charcoal tracking-widest font-serif leading-none">NUTRIVEDA</span>
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.3em] leading-none mt-1">Smart Kitchen</span>
              </div>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-1 p-1 bg-stone-100/50 rounded-full border border-stone-200/50 backdrop-blur-sm">
              <NavItem view="recommend" icon={ChefHat} label="AI Chef" />
              <NavItem view="dashboard" icon={LayoutDashboard} label="Browse" />
              <NavItem view="kitchen" icon={Heart} label="Kitchen" />
              <NavItem view="shopping" icon={ShoppingCart} label="Shop" />
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {shoppingList.length > 0 && (
                 <span className="bg-spice text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm animate-fade-in">
                     {shoppingList.filter(i => !i.checked).length}
                 </span>
              )}
               <button 
                onClick={() => setActiveView('profile')} 
                className={`p-1 rounded-full transition-all border-2
                    ${activeView === 'profile' ? 'border-spice ring-2 ring-spice/20' : 'border-stone-200 hover:border-charcoal'}`}
               >
                 <div className="w-9 h-9 bg-charcoal rounded-full flex items-center justify-center text-white font-serif font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                 </div>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-stone-600">
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
             <div className="md:hidden absolute top-24 left-4 right-4 bg-white rounded-2xl shadow-card border border-stone-100 p-4 space-y-2 animate-fade-in z-50">
                <NavItem view="recommend" icon={ChefHat} label="AI Chef" />
                <NavItem view="dashboard" icon={LayoutDashboard} label="Browse Recipes" />
                <NavItem view="kitchen" icon={Heart} label="My Kitchen" />
                <NavItem view="shopping" icon={ShoppingCart} label="Shopping List" />
                <div className="h-px bg-stone-100 my-2"></div>
                <button 
                    onClick={() => { setActiveView('profile'); setMobileMenuOpen(false); }} 
                    className="flex items-center space-x-2 px-5 py-3 text-stone-600 w-full hover:bg-stone-50 rounded-xl font-medium"
                 >
                    <User className="w-4 h-4 text-spice" />
                    <span>My Profile</span>
                 </button>
             </div>
        )}
      </nav>

      {/* Spacer for Fixed Nav */}
      <div className="h-28 sm:h-36"></div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        
        {/* VIEW: Dashboard & Kitchen */}
        {(activeView === 'dashboard' || activeView === 'kitchen') && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-charcoal font-serif mb-3">
                    {activeView === 'dashboard' ? 'Culinary Explorer' : 'My Kitchen'}
                </h1>
                <p className="text-stone-500 text-lg max-w-2xl font-light">
                    {activeView === 'dashboard' ? 'Discover authentic flavors tailored to your well-being.' : 'Your curated collection of favorite recipes.'}
                </p>
              </div>
              
              <div className="relative group w-full md:w-80">
                <input 
                    type="text" 
                    placeholder="Search recipes..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-spice/20 focus:border-spice transition-all shadow-sm"
                />
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-400 group-focus-within:text-spice transition-colors" />
              </div>
            </div>

            {/* Filters */}
            {activeView === 'dashboard' && (
                <div className="flex overflow-x-auto pb-4 space-x-3 no-scrollbar">
                    {['All', ...Object.values(CuisineType)].map(cuisine => (
                        <button
                            key={cuisine}
                            onClick={() => setSelectedCuisine(cuisine)}
                            className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold transition-all border
                                ${selectedCuisine === cuisine 
                                    ? 'bg-charcoal text-white border-charcoal shadow-md' 
                                    : 'bg-white text-stone-500 border-stone-200 hover:border-spice hover:text-spice'}`}
                        >
                            {cuisine}
                        </button>
                    ))}
                </div>
            )}

            {/* Grid */}
            {filteredRecipes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredRecipes.map(recipe => (
                        <RecipeCard 
                            key={recipe.id} 
                            recipe={recipe} 
                            onView={setSelectedRecipe}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-white rounded-3xl border border-stone-100 shadow-sm">
                    <div className="mx-auto w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-6">
                        <ChefHat className="w-10 h-10 text-stone-300" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-charcoal">No recipes found</h3>
                    <p className="text-stone-500 mt-2">Try adjusting your search or filters to find delicious options.</p>
                </div>
            )}
          </div>
        )}

        {/* VIEW: AI Chef (Home) */}
        {activeView === 'recommend' && (
            <AIRecommendation 
                user={user} 
                onViewRecipe={(r) => {
                    if (!recipes.find(ex => ex.id === r.id)) {
                        setRecipes(prev => [...prev, r]);
                    }
                    setSelectedRecipe(r);
                }}
                onToggleFavorite={handleToggleFavorite}
            />
        )}

        {/* VIEW: Shopping List */}
        {activeView === 'shopping' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-charcoal font-serif">Market List</h1>
                        <p className="text-stone-500 mt-2 font-light">{shoppingList.filter(i => !i.checked).length} items remaining to purchase</p>
                    </div>
                    {shoppingList.length > 0 && (
                        <div className="flex space-x-3">
                             <button 
                                onClick={handleCopyShoppingList}
                                className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all border flex items-center shadow-sm
                                    ${shoppingListCopied 
                                        ? 'bg-basil text-white border-basil' 
                                        : 'text-charcoal bg-white hover:bg-stone-50 border-stone-200'}`}
                            >
                                {shoppingListCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                {shoppingListCopied ? 'Copied!' : 'Copy'}
                            </button>
                            <button 
                                onClick={handleClearShoppingList}
                                className="px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all border border-red-100 flex items-center"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Clear
                            </button>
                        </div>
                    )}
                </div>

                {shoppingList.length === 0 ? (
                    <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-stone-200">
                        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingCart className="w-8 h-8 text-stone-300" />
                        </div>
                        <h3 className="text-lg font-bold text-charcoal">Your basket is empty</h3>
                        <p className="text-stone-500 mt-2 mb-6">Start browsing recipes to build your list.</p>
                        <button 
                            onClick={() => setActiveView('dashboard')}
                            className="px-6 py-2 bg-spice text-white font-bold rounded-full hover:bg-orange-700 transition-colors shadow-lg shadow-spice/20"
                        >
                            Browse Recipes
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {shoppingList.map((item) => (
                            <div 
                                key={item.id} 
                                className={`group p-4 rounded-xl border transition-all duration-200 flex items-start justify-between cursor-pointer
                                    ${item.checked 
                                        ? 'bg-stone-50 border-stone-100 opacity-60' 
                                        : 'bg-white border-stone-200 hover:border-spice/40 hover:shadow-md'}`}
                                onClick={() => handleToggleShoppingItem(item.id)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors
                                        ${item.checked 
                                            ? 'bg-basil border-basil text-white' 
                                            : 'border-stone-300 bg-white group-hover:border-spice'}`}
                                    >
                                        {item.checked && <Check className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className={`font-semibold text-lg leading-tight ${item.checked ? 'text-stone-400 line-through' : 'text-charcoal'}`}>
                                            {item.name}
                                        </p>
                                        <p className="text-sm text-stone-500 mt-1 font-medium">
                                            {item.quantity} 
                                            {item.recipeName && <span className="font-normal text-stone-400 ml-1">• {item.recipeName}</span>}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveShoppingItem(item.id);
                                    }}
                                    className="p-2 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* VIEW: User Profile */}
        {activeView === 'profile' && (
             <UserProfile 
                user={user} 
                email={userEmail || ''} 
                onUpdateProfile={handleUpdateProfile} 
                onLogout={handleLogout}
             />
        )}

      </main>

      {/* Modals */}
      <RecipeDetail 
        recipe={selectedRecipe} 
        isOpen={!!selectedRecipe} 
        onClose={() => setSelectedRecipe(null)}
        onAddToShoppingList={handleAddToShoppingList}
      />

    </div>
  );
};

export default App;