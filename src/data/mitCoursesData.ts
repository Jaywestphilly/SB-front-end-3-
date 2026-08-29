export interface UniversityCourse {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    channelTitle: string;
    thumbnails: {
      medium: { url: string };
      default: { url: string };
    };
  };
  category?: "Computer Science & AI" | "Finance & Economics" | "Mathematics & Physics" | "Business & Management";
  playlistUrl?: string;
  videoCount?: string;
}

export const FALLBACK_UNIVERSITY_COURSES: UniversityCourse[] = [
  {
    id: "PL221E2BBF13BECF6C",
    snippet: {
      title: "MIT 18.06 Linear Algebra - Prof. Gilbert Strang",
      description: "Complete lecture series on Linear Algebra by legendary MIT Professor Gilbert Strang. Matrix algebra, vector spaces, eigenvalues, singular value decomposition, and real-world applications in engineering and data science.",
      publishedAt: "2020-05-15T00:00:00Z",
      channelTitle: "MIT OpenCourseWare",
      thumbnails: {
        medium: { url: "https://img.youtube.com/vi/7UJ4CFRGd-U/hqdefault.jpg" },
        default: { url: "https://img.youtube.com/vi/7UJ4CFRGd-U/hqdefault.jpg" }
      }
    },
    category: "Mathematics & Physics",
    videoCount: "35 Lectures"
  },
  {
    id: "PLUl4u3cNGP63EdVPNLG3ToM6LaEUuStEY",
    snippet: {
      title: "MIT 6.0001 Introduction to Computer Science and Programming in Python",
      description: "MIT's flagship introduction to computer science designed for students with little or no programming experience. Covers Python, algorithms, computation, data structures, and algorithmic complexity.",
      publishedAt: "2021-01-10T00:00:00Z",
      channelTitle: "MIT OpenCourseWare",
      thumbnails: {
        medium: { url: "https://img.youtube.com/vi/ypUa3lX40d4/hqdefault.jpg" },
        default: { url: "https://img.youtube.com/vi/ypUa3lX40d4/hqdefault.jpg" }
      }
    },
    category: "Computer Science & AI",
    videoCount: "26 Lectures"
  },
  {
    id: "PLUl4u3cNGP6317WaSNaciQK8hM526g3mG",
    snippet: {
      title: "MIT 15.401 Finance Theory I - Prof. Andrew Lo",
      description: "Comprehensive introduction to financial management, capital markets, valuation, portfolio theory, risk management, asset pricing models (CAPM), options pricing, and corporate financial strategy.",
      publishedAt: "2019-09-01T00:00:00Z",
      channelTitle: "MIT OpenCourseWare",
      thumbnails: {
        medium: { url: "https://img.youtube.com/vi/HdHlfiOAJyE/hqdefault.jpg" },
        default: { url: "https://img.youtube.com/vi/HdHlfiOAJyE/hqdefault.jpg" }
      }
    },
    category: "Finance & Economics",
    videoCount: "24 Lectures"
  },
  {
    id: "PLUl4u3cNGP63oMNUHXqIUcrkS2PivhN3k",
    snippet: {
      title: "MIT 6.S191 Introduction to Deep Learning",
      description: "MIT's official introductory course on deep learning methods and applications. Covers neural networks, computer vision, natural language processing, generative AI, reinforcement learning, and ethics.",
      publishedAt: "2023-02-01T00:00:00Z",
      channelTitle: "MIT OpenCourseWare",
      thumbnails: {
        medium: { url: "https://img.youtube.com/vi/QDX-1M5Nj7s/hqdefault.jpg" },
        default: { url: "https://img.youtube.com/vi/QDX-1M5Nj7s/hqdefault.jpg" }
      }
    },
    category: "Computer Science & AI",
    videoCount: "12 Lectures"
  },
  {
    id: "PL8486E23F4CCA13E3",
    snippet: {
      title: "Yale ECON 252 Financial Markets - Prof. Robert Shiller",
      description: "Nobel Laureate Robert Shiller presents an overview of ideas, methods, and institutions that permit human society to manage risks and foster enterprise. Stocks, bonds, real estate, behavioral finance, and banking.",
      publishedAt: "2018-04-12T00:00:00Z",
      channelTitle: "YaleCourses",
      thumbnails: {
        medium: { url: "https://img.youtube.com/vi/WEDIj9JBTC8/hqdefault.jpg" },
        default: { url: "https://img.youtube.com/vi/WEDIj9JBTC8/hqdefault.jpg" }
      }
    },
    category: "Finance & Economics",
    videoCount: "26 Lectures"
  },
  {
    id: "PL0-OSYEBN26wA_J2aUuA0U3SgV2iI5kFp",
    snippet: {
      title: "Stanford CS229 Machine Learning - Prof. Andrew Ng",
      description: "The classic Stanford Machine Learning course taught by Andrew Ng. Covers supervised learning, deep learning, generative learning, support vector machines, kernel methods, and reinforcement learning.",
      publishedAt: "2022-08-15T00:00:00Z",
      channelTitle: "Stanford Online",
      thumbnails: {
        medium: { url: "https://img.youtube.com/vi/jGwO_UgTS7I/hqdefault.jpg" },
        default: { url: "https://img.youtube.com/vi/jGwO_UgTS7I/hqdefault.jpg" }
      }
    },
    category: "Computer Science & AI",
    videoCount: "20 Lectures"
  },
  {
    id: "PLUl4u3cNGP61Oq3tWYp6V_F-5jb5L2iHb",
    snippet: {
      title: "MIT 14.01 Principles of Microeconomics - Prof. Jonathan Gruber",
      description: "Fundamental principles of microeconomic analysis. Consumer behavior, supply and demand, competitive markets, monopoly power, market failure, public finance, and economic policy analysis.",
      publishedAt: "2020-03-20T00:00:00Z",
      channelTitle: "MIT OpenCourseWare",
      thumbnails: {
        medium: { url: "https://img.youtube.com/vi/8ssjKR7nNck/hqdefault.jpg" },
        default: { url: "https://img.youtube.com/vi/8ssjKR7nNck/hqdefault.jpg" }
      }
    },
    category: "Finance & Economics",
    videoCount: "26 Lectures"
  },
  {
    id: "PLUl4u3cNGP61M538gBupJ6e2y8AWR_HkW",
    snippet: {
      title: "MIT 6.006 Introduction to Algorithms",
      description: "Comprehensive introduction to mathematical modeling of computational problems. Covers sorting, search trees, dynamic programming, shortest paths, hashing, and graph algorithms.",
      publishedAt: "2021-06-10T00:00:00Z",
      channelTitle: "MIT OpenCourseWare",
      thumbnails: {
        medium: { url: "https://img.youtube.com/vi/HtSuA80QTyo/hqdefault.jpg" },
        default: { url: "https://img.youtube.com/vi/HtSuA80QTyo/hqdefault.jpg" }
      }
    },
    category: "Computer Science & AI",
    videoCount: "24 Lectures"
  },
  {
    id: "PLUl4u3cNGP63aA3O2Kch2KWBIsO_z__8S",
    snippet: {
      title: "MIT 18.01 Single Variable Calculus - Prof. David Jerison",
      description: "Derivatives, integrals, fundamental theorem of calculus, exponential functions, Taylor series, and applications to physics and engineering problems.",
      publishedAt: "2019-11-05T00:00:00Z",
      channelTitle: "MIT OpenCourseWare",
      thumbnails: {
        medium: { url: "https://img.youtube.com/vi/7K1sB05pE0A/hqdefault.jpg" },
        default: { url: "https://img.youtube.com/vi/7K1sB05pE0A/hqdefault.jpg" }
      }
    },
    category: "Mathematics & Physics",
    videoCount: "35 Lectures"
  }
];
