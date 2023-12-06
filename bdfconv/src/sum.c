#include <stdio.h> 

int sum(int a, int b) {
  return a + b;
}

int main(int argc, char **argv)
{
  printf("Number of arguments (argc): %i\n", argc);
    
  for (int i = 0; i < argc; i++) {
      printf("Argument %d (argv): %s\n", i, argv[i]);
  }

  return 0;
}