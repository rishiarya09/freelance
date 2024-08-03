import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { throwError, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = 'http://127.0.0.1:5000';

  constructor(private http: HttpClient) { }

  getCourses(page: number, perPage: number, searchParams: any): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    for (let key in searchParams) {
      if (searchParams[key]) {
        params = params.set(key, searchParams[key]);
      }
    }

    return this.http.get<any>(`${this.apiUrl}/courses`, { params }).pipe(
      catchError(this.handleError)
    );
  }


  getCourse(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/course/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createCourse(course: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/course`, course);
  }

  updateCourse(id: string, course: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/course/${id}`, course);
  }

  deleteCourse(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/course/${id}`);
  }

  getUniversities(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/universities`);
  }

  getCountries(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/countries`);
  }

  getCities(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/cities`);
  }
  
  getCurrencies(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/currencies`);
  }
  
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An Unknown error occured!';
    if(error.error instanceof ErrorEvent) {
      errorMessage = 'A client-side error occurred: ${error.error}';
    } else {
      errorMessage = `Status: ${error.status}, message: ${error.error}`;
    }

    return throwError(errorMessage);
  }
}
